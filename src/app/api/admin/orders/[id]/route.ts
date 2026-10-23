/**
 * Admin Single Order API: Details & Status Actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { canTransition } from '@/core/orders';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        orderItems: true,
        orderEvents: {
          orderBy: { createdAt: 'desc' },
        },
        payments: true,
        files: true,
        accountAccess: {
          select: {
            id: true,
            purgedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, reason, adjustment } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, orderItems: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let targetStatus: OrderStatus = order.status;
    let note = reason || '';
    const now = new Date();
    const updateData: any = {};

    switch (action) {
      case 'ACCEPT':
        targetStatus = 'ACCEPTED';
        updateData.acceptedAt = now;
        note = 'Accepted by admin';
        break;

      case 'DECLINE':
        targetStatus = 'DECLINED';
        note = `Declined by admin: ${reason || 'No reason specified'}`;
        break;

      case 'START':
        targetStatus = 'IN_PROGRESS';
        updateData.startedAt = now;
        note = 'Piloting started by admin';
        break;

      case 'HOLD':
        targetStatus = 'ON_HOLD';
        note = `Order put on hold: ${reason || 'Awaiting customer response'}`;
        break;

      case 'RESUME':
        targetStatus = 'IN_PROGRESS';
        note = 'Order resumed by admin';
        break;

      case 'DONE':
        targetStatus = 'AWAITING_PAYMENT';
        updateData.doneAt = now;
        // Payment due in 24 hours (A5)
        updateData.paymentDueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        // Compute final total from order items
        const finalSum = order.orderItems
          .filter(i => !i.removed)
          .reduce((sum, item) => sum + item.copiedPrice * item.qty, 0);
        updateData.finalTotal = finalSum + (adjustment || order.adjustment);
        note = 'Work marked as done. Invoice generated.';

        // Purge sensitive game credentials immediately on DONE (§10)
        await prisma.accountAccess.updateMany({
          where: { orderId: order.id },
          data: {
            ciphertext: '',
            iv: '',
            tag: '',
            purgedAt: now,
          },
        });
        break;

      case 'CONFIRM_PAYMENT':
        targetStatus = 'COMPLETED';
        updateData.paidAt = now;
        note = 'Payment confirmed by admin';
        // Unblock customer if they were blocked for overdue
        if (order.customer.blocked) {
          await prisma.user.update({
            where: { id: order.customerUserId },
            data: { blocked: false, blockReason: null },
          });
        }
        break;

      case 'REJECT_PAYMENT':
        targetStatus = 'AWAITING_PAYMENT';
        note = `Payment rejected: ${reason || 'Payment not found in bank'}`;
        break;

      case 'CANCEL':
        targetStatus = 'CANCELLED';
        note = `Order cancelled: ${reason || 'Cancelled by admin'}`;
        // Purge credentials if cancelled
        await prisma.accountAccess.updateMany({
          where: { orderId: order.id },
          data: {
            ciphertext: '',
            iv: '',
            tag: '',
            purgedAt: now,
          },
        });
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (!canTransition(order.status, targetStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${targetStatus}` },
        { status: 400 }
      );
    }

    updateData.status = targetStatus;
    if (adjustment !== undefined) {
      updateData.adjustment = adjustment;
    }

    const updatedOrder = await prisma.$transaction(async tx => {
      const res = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          orderItems: true,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: targetStatus,
          note,
        },
      });

      // Write Outbox row for Discord notification (§4.3)
      await tx.outbox.create({
        data: {
          type: 'ORDER_NOTIFICATION',
          payload: {
            orderId: order.id,
            code: order.code,
            action,
            fromStatus: order.status,
            toStatus: targetStatus,
            threadId: order.threadId,
            note,
          },
        },
      });

      return res;
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
