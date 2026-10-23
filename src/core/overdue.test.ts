/**
 * Tests for Overdue order transitions and state validation
 */

import { describe, it, expect } from 'vitest';
import { canTransition } from '@/core/orders';
import { OrderStatus } from '@prisma/client';

describe('overdue and payment state machine rules', () => {
  it('allows AWAITING_PAYMENT to transition to OVERDUE, PAYMENT_REVIEW, ACCEPTED, or CANCELLED', () => {
    expect(canTransition('AWAITING_PAYMENT', 'OVERDUE')).toBe(true);
    expect(canTransition('AWAITING_PAYMENT', 'PAYMENT_REVIEW')).toBe(true);
    expect(canTransition('AWAITING_PAYMENT', 'ACCEPTED')).toBe(true);
    expect(canTransition('AWAITING_PAYMENT', 'CANCELLED')).toBe(true);
  });

  it('allows OVERDUE to transition back to AWAITING_PAYMENT upon admin review or payment initialization', () => {
    expect(canTransition('OVERDUE', 'AWAITING_PAYMENT')).toBe(true);
  });

  it('allows PAYMENT_REVIEW to transition to COMPLETED', () => {
    expect(canTransition('PAYMENT_REVIEW', 'COMPLETED')).toBe(true);
  });
});
