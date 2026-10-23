/**
 * Overdue Payment & Expiry Background Job
 *
 * Checks for orders past paymentDueAt in AWAITING_PAYMENT status:
 * - Transitions them to OVERDUE
 * - Automatically blocks/suspends the customer account (§A5.4)
 * - Queues Discord notifications in outbox
 */

import { Client } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkOverdueOrders(client: Client) {
  try {
    const now = new Date();

    // Find orders in AWAITING_PAYMENT whose paymentDueAt has passed
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: 'AWAITING_PAYMENT',
        paymentDueAt: {
          lt: now,
        },
      },
      include: {
        customer: true,
      },
    });

    for (const order of overdueOrders) {
      await prisma.$transaction(async tx => {
        // Update order status to OVERDUE
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'OVERDUE' },
        });

        // Record order event
        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            fromStatus: 'AWAITING_PAYMENT',
            toStatus: 'OVERDUE',
            note: 'Payment deadline exceeded. Automatically marked overdue and customer suspended.',
          },
        });

        // Block customer account (§5.4)
        if (order.customer && !order.customer.blocked) {
          await tx.user.update({
            where: { id: order.customerUserId },
            data: {
              blocked: true,
              blockReason: `Payment overdue for order ${order.code}`,
            },
          });
        }

        // Queue Discord notification in outbox
        await tx.outbox.create({
          data: {
            type: 'ORDER_NOTIFICATION',
            payload: {
              orderId: order.id,
              code: order.code,
              action: 'OVERDUE',
              threadId: order.threadId,
              content: `🚨 **Payment Overdue Alert**: Order **${order.code}** payment deadline has passed. Your account has been temporarily suspended until payment is completed.`,
            },
          },
        });
      });

      console.log(`[OverdueJob] Order ${order.code} marked OVERDUE and customer ${order.customer?.username} blocked.`);
    }
  } catch (error) {
    console.error('[OverdueJob] Error checking overdue orders:', error);
  }
}
