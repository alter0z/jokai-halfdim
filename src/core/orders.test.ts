/**
 * Tests for order state machine and transitions
 */

import { describe, it, expect } from 'vitest';
import { canTransition, placeOrder, acceptOrder, finishOrder } from './orders';
import { Order, OrderStatus, User } from '@prisma/client';

describe('order state machine', () => {
  const baseOrder: Order = {
    id: 'test-order-1',
    code: 'JK-1234',
    customerUserId: 'user-1',
    status: 'DRAFT',
    quoteTotal: 100000,
    adjustment: 0,
    finalTotal: null,
    uid: '800000000',
    server: 'Asia',
    inGameName: 'Traveler',
    notes: null,
    termsAcceptedAt: new Date(),
    threadId: null,
    acceptedAt: null,
    startedAt: null,
    doneAt: null,
    paymentDueAt: null,
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin: User = {
    id: 'admin-1',
    discordId: '123456',
    username: 'solo_admin',
    role: 'ADMIN',
    blocked: false,
    blockReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('allows valid transitions throughout the lifecycle', () => {
    expect(canTransition('DRAFT', 'PENDING')).toBe(true);
    expect(canTransition('PENDING', 'ACCEPTED')).toBe(true);
    expect(canTransition('PENDING', 'DECLINED')).toBe(true);
    expect(canTransition('ACCEPTED', 'QUEUED')).toBe(true);
    expect(canTransition('QUEUED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'ON_HOLD')).toBe(true);
    expect(canTransition('ON_HOLD', 'IN_PROGRESS')).toBe(true);
    expect(canTransition('IN_PROGRESS', 'AWAITING_PAYMENT')).toBe(true);
    expect(canTransition('AWAITING_PAYMENT', 'PAYMENT_REVIEW')).toBe(true);
    expect(canTransition('PAYMENT_REVIEW', 'COMPLETED')).toBe(true);
  });

  it('prevents illegal transitions', () => {
    expect(canTransition('DRAFT', 'COMPLETED')).toBe(false);
    expect(canTransition('PENDING', 'IN_PROGRESS')).toBe(false);
    expect(canTransition('QUEUED', 'COMPLETED')).toBe(false);
    expect(canTransition('COMPLETED', 'IN_PROGRESS')).toBe(false);
    expect(canTransition('CANCELLED', 'AWAITING_PAYMENT')).toBe(false);
    expect(canTransition('DECLINED', 'ACCEPTED')).toBe(false);
  });

  it('terminal states have zero allowed forward transitions', () => {
    const terminalStates: OrderStatus[] = ['COMPLETED', 'CANCELLED', 'DECLINED', 'EXPIRED'];
    for (const state of terminalStates) {
      const allStates: OrderStatus[] = [
        'DRAFT', 'PENDING', 'ACCEPTED', 'DECLINED', 'QUEUED',
        'EXPIRED', 'IN_PROGRESS', 'ON_HOLD', 'AWAITING_PAYMENT',
        'PAYMENT_REVIEW', 'COMPLETED', 'CANCELLED', 'OVERDUE'
      ];
      for (const target of allStates) {
        expect(canTransition(state, target)).toBe(false);
      }
    }
  });

  it('placeOrder sets status to PENDING', () => {
    const action = placeOrder(baseOrder);
    expect(action.to).toBe('PENDING');
  });

  it('acceptOrder sets status to ACCEPTED', () => {
    const action = acceptOrder({ ...baseOrder, status: 'PENDING' }, mockAdmin);
    expect(action.to).toBe('ACCEPTED');
  });

  it('finishOrder sets status to AWAITING_PAYMENT', () => {
    const action = finishOrder({ ...baseOrder, status: 'IN_PROGRESS' }, mockAdmin);
    expect(action.to).toBe('AWAITING_PAYMENT');
  });
});
