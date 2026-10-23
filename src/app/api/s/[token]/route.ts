/**
 * Secure Login Form Submission API Route
 *
 * Verifies token, encrypts credentials with AES-256-GCM, stores them,
 * and updates order status to QUEUED.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../../../../core/crypto.js';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Find secure link token
    const secureLink = await prisma.secureLink.findUnique({
      where: { tokenHash: token },
      include: { order: true },
    });

    if (!secureLink || secureLink.usedAt || secureLink.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Link is invalid or has expired' }, { status: 400 });
    }

    const masterKey = process.env.ENCRYPTION_KEY || 'default-fallback-key-min-32-chars-long';
    const credentialsJson = JSON.stringify({ username, password });
    const encrypted = encrypt(credentialsJson, masterKey);

    // Store encrypted credentials in AccountAccess
    await prisma.accountAccess.upsert({
      where: { orderId: secureLink.orderId },
      update: {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
        keyVersion: encrypted.keyVersion,
        purgedAt: null,
      },
      create: {
        orderId: secureLink.orderId,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
        keyVersion: encrypted.keyVersion,
      },
    });

    // Mark link as used
    await prisma.secureLink.update({
      where: { id: secureLink.id },
      data: { usedAt: new Date() },
    });

    // Update order status to QUEUED
    await prisma.order.update({
      where: { id: secureLink.orderId },
      data: { status: 'QUEUED' },
    });

    // Log order event
    await prisma.orderEvent.create({
      data: {
        orderId: secureLink.orderId,
        fromStatus: secureLink.order.status,
        toStatus: 'QUEUED',
        note: 'Customer submitted login details via secure form',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing secure login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
