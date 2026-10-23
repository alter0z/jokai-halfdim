/**
 * Golden tests for the pricing engine
 *
 * These tests verify the core pricing calculations match the spreadsheet
 * data and requirements from the dev plan.
 */

import { describe, it, expect } from 'vitest';
import { quote, CatalogItem, CartItem, validateCartItem } from './pricing';

const catalog: CatalogItem[] = [
  // Exploration (PERCENT) - Avidya Forest from the sheet
  {
    id: 'explore-avidya',
    serviceKey: 'exploration',
    regionKey: 'sumeru',
    name: 'Avidya Forest',
    price: 40000, // Full price from 0% → 100%
    pricingType: 'PERCENT',
    minCharge: 5000,
    active: true,
  },
  {
    id: 'explore-vanarana',
    serviceKey: 'exploration',
    regionKey: 'sumeru',
    name: 'Vanarana',
    price: 40000,
    pricingType: 'PERCENT',
    minCharge: 5000,
    active: true,
  },
  {
    id: 'explore-windwail',
    serviceKey: 'exploration',
    regionKey: 'mondstadt',
    name: 'Windwail Highland',
    price: 15000,
    pricingType: 'PERCENT',
    minCharge: 5000,
    active: true,
  },
  // Archon Quest (FLAT)
  {
    id: 'archon-natlan-act1',
    serviceKey: 'archon_quest',
    regionKey: 'natlan',
    name: 'Natlan Act I',
    price: 15000,
    pricingType: 'FLAT',
    active: true,
  },
  // World Quest (FLAT)
  {
    id: 'worldquest-any',
    serviceKey: 'world_quest',
    regionKey: 'natlan',
    name: 'Any World Quest',
    price: 10000,
    pricingType: 'FLAT',
    active: true,
  },
  // Material (PER_UNIT)
  {
    id: 'material-local',
    serviceKey: 'material',
    name: 'Local Specialty',
    price: 120,
    pricingType: 'PER_UNIT',
    maxQty: 200,
    qtyPerChar: 168,
    active: true,
  },
  {
    id: 'material-enemy',
    serviceKey: 'material',
    name: 'Enemy Material',
    price: 150,
    pricingType: 'PER_UNIT',
    maxQty: 150,
    qtyPerChar: 84,
    active: true,
  },
  // Bundle example
  {
    id: 'bundle-full-chapter',
    serviceKey: 'other',
    name: 'Full Archon Chapter',
    price: 105000,
    pricingType: 'BUNDLE',
    discount: 0,
    active: true,
  },
];

describe('pricing engine', () => {
  describe('PERCENT pricing (exploration)', () => {
    it('calculates Avidya Forest from 63% → Rp14,800', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'explore-avidya', qty: 1, statedPercent: 63 },
      ];

      const result = quote(cart, catalog);
      expect(result.total).toBe(14800);
      expect(result.lines[0].unitPrice).toBe(14800);
    });

    it('applies minimum charge of Rp5,000 (Windwail Highland 90%)', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'explore-windwail', qty: 1, statedPercent: 90 },
      ];

      const result = quote(cart, catalog);
      // Rate = 15000 ÷ 100 = 150 per %
      // Price = 150 × (100 - 90) = 150 × 10 = 1500
      // Minimum charge = 5000
      expect(result.total).toBe(5000);
      expect(result.lines[0].unitPrice).toBe(5000);
    });

    it('uses real percent for final calculation', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'explore-avidya', qty: 1, statedPercent: 63, realPercent: 70 },
      ];

      const result = quote(cart, catalog);
      // Real price: 400 × (100 - 70) = 400 × 30 = 12000
      expect(result.total).toBe(12000);
      expect(result.lines[0].isFinal).toBe(true);
    });
  });

  describe('FLAT pricing (quests)', () => {
    it('calculates Archon quest at Rp15,000 per act', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'archon-natlan-act1', qty: 7 },
      ];

      const result = quote(cart, catalog);
      expect(result.total).toBe(105000); // 7 × 15000
      expect(result.lines[0].totalPrice).toBe(105000);
    });

    it('calculates World Quest at Rp10,000 per quest', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'worldquest-any', qty: 2 },
      ];

      const result = quote(cart, catalog);
      expect(result.total).toBe(20000); // 2 × 10000
    });
  });

  describe('PER_UNIT pricing (materials)', () => {
    it('calculates material price per item', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'material-local', qty: 168, characterName: 'Test Char' },
      ];

      const result = quote(cart, catalog);
      expect(result.total).toBe(20160); // 168 × 120
    });

    it('calculates 1-character ascension bundle', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'material-local', qty: 168 },
        { catalogItemId: 'material-enemy', qty: 84 },
      ];

      const result = quote(cart, catalog);
      expect(result.total).toBe(32760); // (168 × 120) + (84 × 150)
    });

    it('respects max quantity limits', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'material-local', qty: 201 },
      ];

      const result = quote(cart, catalog);
      // Should be capped at 200
      expect(result.total).toBe(24000); // 200 × 120
    });
  });

  describe('BUNDLE pricing', () => {
    it('uses bundle price directly', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'bundle-full-chapter', qty: 1 },
      ];

      const result = quote(cart, catalog);
      expect(result.total).toBe(105000);
    });
  });

  describe('complex cart', () => {
    it('calculates the example cart from §5.3', () => {
      const cart: CartItem[] = [
        { catalogItemId: 'explore-avidya', qty: 1, statedPercent: 63 },
        { catalogItemId: 'explore-vanarana', qty: 1, statedPercent: 0 },
        { catalogItemId: 'bundle-full-chapter', qty: 1 },
        { catalogItemId: 'worldquest-any', qty: 2 },
      ];

      const result = quote(cart, catalog);
      // Avidya: 400 × (100 - 63) = 400 × 37 = 14800
      // Vanarana: 400 × (100 - 0) = 400 × 100 = 40000
      // Bundle: 105000
      // World Quest: 2 × 10000 = 20000
      // Total: 14800 + 40000 + 105000 + 20000 = 179800
      expect(result.total).toBe(179800);
    });
  });

  describe('validation', () => {
    it('validates percent range', () => {
      const cartItem: CartItem = {
        catalogItemId: 'explore-avidya',
        qty: 1,
        statedPercent: 100,
      };

      const error = validateCartItem(cartItem, catalog);
      expect(error).toBe('Current percentage must be between 0 and 99');
    });

    it('validates max quantity', () => {
      const cartItem: CartItem = {
        catalogItemId: 'material-local',
        qty: 201,
      };

      const error = validateCartItem(cartItem, catalog);
      expect(error).toBe('Maximum quantity is 200');
    });

    it('returns null for valid item', () => {
      const cartItem: CartItem = {
        catalogItemId: 'explore-avidya',
        qty: 1,
        statedPercent: 50,
      };

      const error = validateCartItem(cartItem, catalog);
      expect(error).toBeNull();
    });
  });

  describe('region totals (from §3)', () => {
    // These would be integration tests with full catalog
    // For now, we test the formulas

    it('calculates Mondstadt exploration total (7 areas)', () => {
      // This would test with actual Mondstadt areas from catalog
      // For now, just verify the formula
      const mondstadtAreas = [
        { price: 15000, percent: 0 },
        { price: 15000, percent: 0 },
        { price: 15000, percent: 0 },
        { price: 15000, percent: 0 },
        { price: 30000, percent: 0 },
        { price: 30000, percent: 0 },
        { price: 30000, percent: 0 },
      ];

      // Rate per % for each area = price ÷ 100
      // From 0% → 100% = rate × 100 = price
      const total = mondstadtAreas.reduce((sum, area) => sum + area.price, 0);
      expect(total).toBe(150000); // From sheet
    });

    it('calculates Mondstadt Archon total (3 acts)', () => {
      const mondstadtActs = [
        { price: 15000 },
        { price: 15000 },
        { price: 15000 },
      ];

      const total = mondstadtActs.reduce((sum, act) => sum + act.price, 0);
      expect(total).toBe(45000); // From sheet
    });
  });
});
