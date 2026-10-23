/**
 * Order actions and state machine
 *
 * Every order state change is one function here.
 * Both bot and website call the same functions.
 */

import { Order, OrderStatus, OrderEvent, User } from '@prisma/client';

export type OrderStatusTransition = Record<OrderStatus, OrderStatus[]>;

export const ALLOWED_TRANSITIONS: OrderStatusTransition = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['QUEUED', 'EXPIRED'],
  DECLINED: [],
  QUEUED: ['IN_PROGRESS', 'EXPIRED'],
  EXPIRED: [],
  IN_PROGRESS: ['ON_HOLD', 'AWAITING_PAYMENT', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS'],
  AWAITING_PAYMENT: ['PAYMENT_REVIEW', 'OVERDUE', 'ACCEPTED', 'CANCELLED'],
  PAYMENT_REVIEW: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  OVERDUE: ['AWAITING_PAYMENT'],
};

export interface OrderAction {
  from: OrderStatus;
  to: OrderStatus;
  note?: string;
}

/**
 * Check if a status transition is allowed
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Place a new order (DRAFT → PENDING)
 */
export function placeOrder(order: Order): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'PENDING')) {
    throw new Error(`Cannot place order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'PENDING',
    note: 'Order placed by customer',
  };
}

/**
 * Accept an order (PENDING → ACCEPTED)
 */
export function acceptOrder(order: Order, admin: User): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'ACCEPTED')) {
    throw new Error(`Cannot accept order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'ACCEPTED',
    note: `Order accepted by ${admin.username}`,
  };
}

/**
 * Decline an order (PENDING → DECLINED)
 */
export function declineOrder(order: Order, admin: User, reason?: string): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'DECLINED')) {
    throw new Error(`Cannot decline order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'DECLINED',
    note: `Order declined: ${reason || 'No reason provided'}`,
  };
}

/**
 * Customer submits login form (ACCEPTED → QUEUED)
 */
export function submitLoginForm(order: Order): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'QUEUED')) {
    throw new Error(`Cannot submit login from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'QUEUED',
    note: 'Customer submitted login details',
  };
}

/**
 * Start working on the order (QUEUED → IN_PROGRESS)
 */
export function startOrder(order: Order, admin: User): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'IN_PROGRESS')) {
    throw new Error(`Cannot start order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'IN_PROGRESS',
    note: `Started by ${admin.username}`,
  };
}

/**
 * Put order on hold (IN_PROGRESS → ON_HOLD)
 */
export function holdOrder(order: Order, admin: User, reason: string): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'ON_HOLD')) {
    throw new Error(`Cannot hold order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'ON_HOLD',
    note: `On hold: ${reason}`,
  };
}

/**
 * Resume from hold (ON_HOLD → IN_PROGRESS)
 */
export function resumeOrder(order: Order, admin: User): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'IN_PROGRESS')) {
    throw new Error(`Cannot resume order from status ${order.status}`);
  }

  return {
    from: 'ON_HOLD',
    to: 'IN_PROGRESS',
    note: `Resumed by ${admin.username}`,
  };
}

/**
 * Mark order as done (IN_PROGRESS → AWAITING_PAYMENT)
 */
export function finishOrder(order: Order, admin: User): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'AWAITING_PAYMENT')) {
    throw new Error(`Cannot finish order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'AWAITING_PAYMENT',
    note: `Marked done by ${admin.username}, waiting for payment`,
  };
}

/**
 * Customer submits payment proof (AWAITING_PAYMENT → PAYMENT_REVIEW)
 */
export function submitPayment(order: Order): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'PAYMENT_REVIEW')) {
    throw new Error(`Cannot submit payment from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'PAYMENT_REVIEW',
    note: 'Payment proof submitted by customer',
  };
}

/**
 * Confirm payment received (PAYMENT_REVIEW → COMPLETED)
 */
export function confirmPayment(order: Order, admin: User): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'COMPLETED')) {
    throw new Error(`Cannot confirm payment from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'COMPLETED',
    note: `Payment confirmed by ${admin.username}`,
  };
}

/**
 * Reject payment proof (PAYMENT_REVIEW → AWAITING_PAYMENT)
 */
export function rejectPayment(order: Order, admin: User, reason: string): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'AWAITING_PAYMENT')) {
    throw new Error(`Cannot reject payment from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'AWAITING_PAYMENT',
    note: `Payment rejected: ${reason}`,
  };
}

/**
 * Cancel an order (from DRAFT, PENDING, ACCEPTED, or QUEUED)
 */
export function cancelOrder(order: Order, actor: User, reason?: string): OrderAction {
  const currentStatus = order.status as OrderStatus;

  if (!canTransition(currentStatus, 'CANCELLED')) {
    throw new Error(`Cannot cancel order from status ${currentStatus}`);
  }

  return {
    from: currentStatus,
    to: 'CANCELLED',
    note: `Cancelled by ${actor.username}: ${reason || 'No reason provided'}`,
  };
}

/**
 * Mark as expired (login form not submitted within 24h)
 */
export function expireOrder(order: Order): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'EXPIRED')) {
    throw new Error(`Cannot expire order from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'EXPIRED',
    note: 'Order expired: login form not submitted within 24 hours',
  };
}

/**
 * Mark as overdue (payment not received within 72h)
 */
export function markOverdue(order: Order): OrderAction {
  if (!canTransition(order.status as OrderStatus, 'OVERDUE')) {
    throw new Error(`Cannot mark order overdue from status ${order.status}`);
  }

  return {
    from: order.status as OrderStatus,
    to: 'OVERDUE',
    note: 'Order marked overdue: payment not received within 72 hours',
  };
}

/**
 * Report a problem (AWAITING_PAYMENT → ACCEPTED to resend login)
 */
export function reportProblem(order: Order, customer: User, reason: string): OrderAction {
  if (order.status !== 'AWAITING_PAYMENT') {
    throw new Error(`Can only report problems from AWAITING_PAYMENT status, current: ${order.status}`);
  }

  return {
    from: 'AWAITING_PAYMENT',
    to: 'ACCEPTED',
    note: `Problem reported by ${customer.username}: ${reason}. Send new login link.`,
  };
}
