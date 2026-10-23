/**
 * Tests for order state machine and transitions
 */

import { describe, it, expect } from 'vitest';
import { canTransition, placeOrder, acceptOrder, finishOrder } from './orders';
import { Order, OrderStatus } from '@prisma/client';

describe('order state machine', () => {
  const mockOrder: Order = {
    id: 'test-order-1',
    code: 'JK-1234',
    customerUserId: 'user-1',
    status: 'DRAFT',
    quoteTotal: 100000,
    adjustment: 0,
    finalTotal: null,
    uid: '800000000',
    server: 'os',
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

  it('allows valid transitions (DRAFT → PENDING)', () => {
    expect(canTransition('DRAFT', 'PENDING')).toBe(true);
    const action = placeOrder(mockOrder);
    expect(action.to).toBe('PENDING');
  });

  it('prevents invalid transitions (DRAFT → COMPLETED)', () => {
    expect(canTransition('DRAFT', 'COMPLETED')).toBe(false);
    expect(() => placeOrder({ ...mockOrder, status: 'COMPLETED' })).toThrow();
  });
});
