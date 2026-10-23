/**
 * Order Work API: Checklist, Real %, and Verification Code
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, itemId, realPercent, removed, requestCode } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (requestCode) {
      // Create Outbox message to ping customer in Discord for 2FA code (§5.3.7)
      await prisma.outbox.create({
        data: {
          type: 'ORDER_NOTIFICATION',
          payload: {
            orderId: order.id,
            code: order.code,
            action: 'REQUEST_CODE',
            threadId: order.threadId,
            content: `🔑 **Verification Code Needed!** Please enter your one-time code for **${order.code}**.`,
          },
        },
      });

      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: 'ON_HOLD',
          note: 'Verification code requested from customer',
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'ON_HOLD' },
      });

      return NextResponse.json({ message: 'Verification code requested' });
    }

    if (itemId) {
      const item = order.orderItems.find(i => i.id === itemId);
      if (!item) {
        return NextResponse.json({ error: 'Item not found in order' }, { status: 404 });
      }

      const itemUpdates: any = {};

      if (action === 'TOGGLE_DONE') {
        itemUpdates.doneAt = item.doneAt ? null : new Date();
      }

      if (action === 'TOGGLE_REMOVED') {
        itemUpdates.removed = removed !== undefined ? removed : !item.removed;
      }

      if (realPercent !== undefined) {
        itemUpdates.realPercent = realPercent;
        // If real % is lower than stated %, price per % goes up (more work)
        if (item.statedPercent !== null && item.statedPercent !== undefined) {
          const catalogItem = await prisma.catalogItem.findUnique({
            where: { id: item.catalogItemId },
          });

          if (catalogItem && catalogItem.pricingType === 'PERCENT') {
            const rate = catalogItem.price / 100;
            const newCalculatedPrice = Math.max(
              Math.floor(rate * (100 - realPercent)),
              catalogItem.minCharge || 5000
            );
            itemUpdates.copiedPrice = newCalculatedPrice;

            if (realPercent < item.statedPercent) {
              // Real % is lower → notify customer to approve new price (§5.3.5)
              await prisma.outbox.create({
                data: {
                  type: 'ORDER_NOTIFICATION',
                  payload: {
                    orderId: order.id,
                    code: order.code,
                    action: 'PRICE_INCREASE',
                    threadId: order.threadId,
                    content: `⚠️ **Price Adjustment Notice**: Real exploration in **${item.copiedName}** was found to be ${realPercent}% (stated ${item.statedPercent}%). New price: Rp${newCalculatedPrice.toLocaleString('id-ID')}.`,
                  },
                },
              });
            }
          }
        }
      }

      const updatedItem = await prisma.orderItem.update({
        where: { id: itemId },
        data: itemUpdates,
      });

      // Recalculate order total from remaining active items
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });
      const activeItemsTotal = allItems
        .filter(i => !i.removed)
        .reduce((sum, i) => sum + i.copiedPrice * i.qty, 0);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          quoteTotal: activeItemsTotal,
        },
      });

      return NextResponse.json({ item: updatedItem });
    }

    return NextResponse.json({ error: 'No item or action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating work:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
