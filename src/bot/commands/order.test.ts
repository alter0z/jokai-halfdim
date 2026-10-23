/**
 * Tests for Order Slash Commands definition
 */

import { describe, it, expect } from 'vitest';
import { orderCommands } from './order';

describe('orderCommands definition', () => {
  it('registers /order, /status, and /cancel', () => {
    const names = orderCommands.map(c => c.name);
    expect(names).toContain('order');
    expect(names).toContain('status');
    expect(names).toContain('cancel');
  });

  it('/status has optional code option', () => {
    const statusCmd = orderCommands.find(c => c.name === 'status')?.toJSON();
    expect(statusCmd).toBeDefined();
    const codeOption = statusCmd?.options?.find((o: any) => o.name === 'code');
    expect(codeOption).toBeDefined();
    expect(codeOption?.required).toBe(false);
  });

  it('/cancel requires order code', () => {
    const cancelCmd = orderCommands.find(c => c.name === 'cancel')?.toJSON();
    expect(cancelCmd).toBeDefined();
    const codeOption = cancelCmd?.options?.find((o: any) => o.name === 'code');
    expect(codeOption).toBeDefined();
    expect(codeOption?.required).toBe(true);
  });
});
