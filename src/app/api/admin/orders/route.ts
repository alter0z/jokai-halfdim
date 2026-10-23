/**
 * Admin Orders API: List & Create Custom Order
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const search = searchParams.get('search');

    const where: any = {};

    if (status && status !== ('ALL' as any)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { uid: { contains: search, mode: 'insensitive' } },
        { inGameName: { contains: search, mode: 'insensitive' } },
        { customer: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: true,
        payments: true,
        accountAccess: {
          select: {
            id: true,
            purgedAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerDiscordId, customerUsername, uid, server, inGameName, notes, items, quoteTotal } = body;

    // Find or create customer user
    let user = await prisma.user.findFirst({
      where: customerDiscordId ? { discordId: customerDiscordId } : { username: customerUsername },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: customerUsername || 'Custom Customer',
          discordId: customerDiscordId || null,
        },
      });
    }

    // Generate random 4-char code: JK-XXXX
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'JK-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const order = await prisma.order.create({
      data: {
        code,
        customerUserId: user.id,
        status: 'PENDING',
        quoteTotal: quoteTotal || 0,
        uid: uid || null,
        server: server || null,
        inGameName: inGameName || null,
        notes: notes || null,
        orderItems: {
          create: (items || []).map((it: any) => ({
            catalogItemId: it.catalogItemId,
            copiedName: it.name,
            copiedPrice: it.price,
            qty: it.qty || 1,
            statedPercent: it.statedPercent || null,
          })),
        },
        orderEvents: {
          create: {
            toStatus: 'PENDING',
            note: 'Order created via Admin dashboard',
          },
        },
      },
      include: {
        customer: true,
        orderItems: true,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
