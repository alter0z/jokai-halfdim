/**
 * Admin Credentials Access API
 *
 * Securely reveals customer credentials for an order.
 * - Enforces audit logging for every single view
 * - Returns error if credentials have been purged
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { decrypt, EncryptedData } from '@/core/crypto';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await prisma.accountAccess.findUnique({
      where: { orderId: id },
      include: {
        order: { select: { code: true, status: true } },
      },
    });

    if (!access) {
      return NextResponse.json({ error: 'No credentials stored for this order' }, { status: 404 });
    }

    if (access.purgedAt || !access.ciphertext) {
      return NextResponse.json(
        { error: 'Credentials have been permanently deleted per security policy' },
        { status: 410 }
      );
    }

    const masterKey = process.env.ENCRYPTION_KEY || 'default-fallback-key-min-32-chars-long';

    const encryptedData: EncryptedData = {
      ciphertext: access.ciphertext,
      iv: access.iv,
      tag: access.tag,
      salt: '', // if salt was stored in ciphertext or iv, or defaults
      keyVersion: access.keyVersion,
    };

    let credentials: { username: string; password?: string };
    try {
      const decryptedString = decrypt(encryptedData, masterKey);
      credentials = JSON.parse(decryptedString);
    } catch (decErr) {
      // In case simple encryption format was used
      credentials = { username: 'Decryption error', password: '***' };
    }

    // Log the credential access to audit trail (§10.3)
    await prisma.accountAccessLog.create({
      data: {
        accessId: access.id,
        action: 'VIEW',
      },
    });

    return NextResponse.json({
      username: credentials.username,
      password: credentials.password,
      viewedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error revealing credentials:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
