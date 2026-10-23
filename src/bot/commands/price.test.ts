/**
 * Tests for bot pricing commands and quote formatting
 */

import { describe, it, expect } from 'vitest';
import { quote, CatalogItem, CartItem } from '../../core/pricing';

describe('bot pricing flow helper tests', () => {
  it('correctly calculates exploration quote for bot cart', () => {
    const catalog: CatalogItem[] = [
      {
        id: '1',
        serviceKey: 'exploration',
        regionKey: 'sumeru',
        name: 'Avidya Forest',
        price: 40000,
        pricingType: 'PERCENT',
        minCharge: 5000,
        active: true,
      },
    ];

    const cart: CartItem[] = [
      { catalogItemId: '1', qty: 1, statedPercent: 50 },
    ];

    const result = quote(cart, catalog);
    // Rate = 40000 / 100 = 400 per %
    // 100 - 50 = 50% remaining
    // 400 * 50 = 20000
    expect(result.total).toBe(20000);
  });
});
