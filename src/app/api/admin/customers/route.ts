/**
 * Admin Customers API: List & Block/Unblock
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { discordId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      include: {
        orders: {
          select: {
            id: true,
            code: true,
            status: true,
            quoteTotal: true,
            finalTotal: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customersWithStats = customers.map(c => {
      const totalOrders = c.orders.length;
      const completedOrders = c.orders.filter(o => o.status === 'COMPLETED');
      const totalSpent = completedOrders.reduce((sum, o) => sum + (o.finalTotal || o.quoteTotal), 0);
      const hasUnpaid = c.orders.some(o => o.status === 'AWAITING_PAYMENT' || o.status === 'OVERDUE');

      return {
        id: c.id,
        discordId: c.discordId,
        username: c.username,
        role: c.role,
        blocked: c.blocked,
        blockReason: c.blockReason,
        createdAt: c.createdAt,
        totalOrders,
        totalSpent,
        hasUnpaid,
        recentOrders: c.orders.slice(0, 3),
      };
    });

    return NextResponse.json({ customers: customersWithStats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, blocked, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        blocked: Boolean(blocked),
        blockReason: blocked ? reason || 'Blocked by admin' : null,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
