/**
 * Admin Settings API: Get & Update Settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, any> = {};

    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      shopStatus: settingsMap['shop_status'] || { isOpen: true },
      queueLimit: settingsMap['queue_limit'] || { limit: 10 },
      firstOrderLimit: settingsMap['first_order_limit'] || { limit: 200000, enabled: true },
      explorationMinimum: settingsMap['exploration_minimum'] || { amount: 5000 },
      timers: settingsMap['timers'] || {
        loginExpiresHours: 24,
        paymentDueHours: 24,
        overdueHours: 72,
        reminderHours: [12, 24],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopStatus, queueLimit, firstOrderLimit, explorationMinimum, timers } = body;

    if (shopStatus !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'shop_status' },
        update: { value: shopStatus },
        create: { key: 'shop_status', value: shopStatus },
      });
    }

    if (queueLimit !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'queue_limit' },
        update: { value: queueLimit },
        create: { key: 'queue_limit', value: queueLimit },
      });
    }

    if (firstOrderLimit !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'first_order_limit' },
        update: { value: firstOrderLimit },
        create: { key: 'first_order_limit', value: firstOrderLimit },
      });
    }

    if (explorationMinimum !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'exploration_minimum' },
        update: { value: explorationMinimum },
        create: { key: 'exploration_minimum', value: explorationMinimum },
      });
    }

    if (timers !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'timers' },
        update: { value: timers },
        create: { key: 'timers', value: timers },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
