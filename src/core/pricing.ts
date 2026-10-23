/**
 * Jokai pricing engine
 *
 * A pure function that computes quotes from cart items and catalog data.
 * No DB, no Discord - just business logic.
 */

export type PricingType = 'PERCENT' | 'FLAT' | 'PER_UNIT' | 'BUNDLE' | 'CUSTOM';

export interface CatalogItem {
  id: string;
  serviceKey: string;
  regionKey?: string;
  name: string;
  price: number;
  pricingType: PricingType;
  minCharge?: number;
  chapter?: string;
  actNumber?: string;
  maxQty?: number;
  qtyPerCharacter?: number;
  discount?: number;
  active: boolean;
}

export interface CartItem {
  catalogItemId: string;
  qty: number;
  statedPercent?: number;  // For PERCENT pricing (exploration)
  realPercent?: number;     // For PERCENT pricing - actual value recorded
  characterName?: string;   // For material items
}

export interface QuoteLine {
  catalogItemId: string;
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  isFinal: boolean;  // true if using real percent instead of stated
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  adjustment: number;
  total: number;
}

/**
 * Compute a quote from cart items and catalog
 */
export function quote(cart: CartItem[], catalog: CatalogItem[]): Quote {
  const lines: QuoteLine[] = [];
  let subtotal = 0;

  for (const cartItem of cart) {
    const item = catalog.find(i => i.id === cartItem.catalogItemId);
    if (!item || !item.active) continue;

    const line = computeLine(item, cartItem);
    if (line) {
      lines.push(line);
      subtotal += line.totalPrice;
    }
  }

  const total = subtotal + Math.floor(subtotal * (subtotal < 0 ? -1 : 1) * 0); // No default tax/adjustment

  return {
    lines,
    subtotal,
    adjustment: 0,
    total,
  };
}

/**
 * Compute a single quote line from a catalog item and cart item
 */
function computeLine(item: CatalogItem, cartItem: CartItem): QuoteLine | null {
  const { statedPercent, realPercent, qty, characterName } = cartItem;

  switch (item.pricingType) {
    case 'PERCENT': {
      // Exploration: rate per % × (100 − current %)
      const percent = realPercent !== undefined ? realPercent : (statedPercent ?? 0);
      const ratePerPercent = item.price / 100;
      let price = Math.floor(ratePerPercent * (100 - percent));

      // Apply minimum charge
      const minCharge = item.minCharge ?? 5000;
      price = Math.max(price, minCharge);

      const description = realPercent !== undefined
        ? `Actual: ${percent}%`
        : `Target: ${statedPercent}%`;

      return {
        catalogItemId: item.id,
        name: item.name,
        description,
        qty: 1,
        unitPrice: price,
        totalPrice: price,
        isFinal: realPercent !== undefined,
      };
    }

    case 'FLAT': {
      // Archon quest or world quest: price × qty
      const quantity = qty ?? 1;
      const price = item.price * quantity;

      return {
        catalogItemId: item.id,
        name: item.name,
        description: item.chapter ? `Chapter ${item.chapter}` : '',
        qty: quantity,
        unitPrice: item.price,
        totalPrice: price,
        isFinal: true,
      };
    }

    case 'PER_UNIT': {
      // Material: price per item × qty, capped at max
      const quantity = Math.min(qty ?? 1, item.maxQty ?? Infinity);
      const price = item.price * quantity;

      let description = '';
      if (characterName) {
        description = `for ${characterName}`;
      }

      return {
        catalogItemId: item.id,
        name: item.name,
        description,
        qty: quantity,
        unitPrice: item.price,
        totalPrice: price,
        isFinal: true,
      };
    }

    case 'BUNDLE': {
      // Bundle: sum of items - discount
      const bundlePrice = item.price;
      return {
        catalogItemId: item.id,
        name: item.name,
        description: item.discount ? `Discount: ${item.discount}` : '',
        qty: 1,
        unitPrice: bundlePrice,
        totalPrice: bundlePrice,
        isFinal: true,
      };
    }

    case 'CUSTOM': {
      // Custom: use the set price
      return {
        catalogItemId: item.id,
        name: item.name,
        description: '',
        qty: qty ?? 1,
        unitPrice: item.price,
        totalPrice: item.price * (qty ?? 1),
        isFinal: true,
      };
    }

    default:
      return null;
  }
}

/**
 * Calculate progress percentage for an order
 */
export function calculateProgress(lines: QuoteLine[], completedItems: string[]): number {
  if (lines.length === 0) return 0;

  const totalValue = lines.reduce((sum, line) => sum + line.totalPrice, 0);
  const completedValue = lines
    .filter(line => completedItems.includes(line.catalogItemId))
    .reduce((sum, line) => sum + line.totalPrice, 0);

  if (totalValue === 0) return 0;
  return Math.floor((completedValue / totalValue) * 100);
}

/**
 * Validate a cart item before adding to cart
 */
export function validateCartItem(item: CartItem, catalog: CatalogItem[]): string | null {
  const catalogItem = catalog.find(i => i.id === item.catalogItemId);
  if (!catalogItem) return 'Item not found in catalog';

  if (!catalogItem.active) return 'Item is not active';

  if (catalogItem.pricingType === 'PERCENT') {
    const percent = item.statedPercent ?? 0;
    if (percent < 0 || percent >= 100) return 'Current percentage must be between 0 and 99';
  }

  if (catalogItem.maxQty && (item.qty ?? 1) > catalogItem.maxQty) {
    return `Maximum quantity is ${catalogItem.maxQty}`;
  }

  return null;
}
