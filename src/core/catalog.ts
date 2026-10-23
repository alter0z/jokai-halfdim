/**
 * Catalog management — validation, archiving, change log
 *
 * Rules for modifying the service catalog:
 * - Validation: prices are whole numbers, names unique per service+region
 * - Archive vs delete: can only delete items never used in orders
 * - Change log: every edit tracked with old/new values
 * - Live update: changes go out via outbox → bot reloads
 */

import { PrismaClient } from '@prisma/client';

export interface CatalogEditRequest {
  serviceKey: string;
  name: string;
  regionKey?: string;
  price?: number;
  active?: boolean;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a catalog item before saving
 */
export function validateCatalogItem(item: CatalogEditRequest): ValidationResult {
  const errors: string[] = [];

  if (!item.name || item.name.length === 0) {
    errors.push('Name is required');
  }
  if (item.name && item.name.length > 100) {
    errors.push('Name must be 100 characters or less');
  }

  if (item.price !== undefined) {
    if (!Number.isInteger(item.price) || item.price < 0) {
      errors.push('Price must be a whole number >= 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Warn on large price changes (potential typos)
 */
export function priceChangeWarning(oldPrice: number, newPrice: number): string | null {
  if (oldPrice === 0) return null;

  const percentChange = Math.abs((newPrice - oldPrice) / oldPrice);
  if (percentChange > 0.5) {
    return `Price changed by ${Math.round(percentChange * 100)}%: Rp${oldPrice.toLocaleString('id-ID')} → Rp${newPrice.toLocaleString('id-ID')}`;
  }

  return null;
}

/**
 * Check if an item can be deleted (never used in any order)
 */
export async function canDelete(prisma: PrismaClient, itemId: string): Promise<boolean> {
  const orderCount = await prisma.orderItem.count({
    where: { catalogItemId: itemId },
  });

  return orderCount === 0;
}

/**
 * Archive an item instead of deleting (if it's been used)
 */
export async function archiveItem(
  prisma: PrismaClient,
  itemId: string,
  oldValues: Record<string, unknown>
): Promise<void> {
  const now = new Date();

  await prisma.catalogItem.update({
    where: { id: itemId },
    data: { archivedAt: now },
  });

  // Log the archive action
  await prisma.catalogChange.create({
    data: {
      list: 'catalog_items',
      recordId: itemId,
      action: 'ARCHIVE',
      oldValues: oldValues as any,
      newValues: { archivedAt: now } as any,
    },
  });
}

/**
 * Delete an item that was never used
 */
export async function deleteItem(
  prisma: PrismaClient,
  itemId: string,
  oldValues: Record<string, unknown>
): Promise<void> {
  const canDeleteItem = await canDelete(prisma, itemId);
  if (!canDeleteItem) {
    throw new Error('Cannot delete item that has been used in orders. Archive it instead.');
  }

  await prisma.catalogItem.delete({
    where: { id: itemId },
  });

  // Log the deletion
  await prisma.catalogChange.create({
    data: {
      list: 'catalog_items',
      recordId: itemId,
      action: 'DELETE',
      oldValues: oldValues as any,
      newValues: {} as any,
    },
  });
}

/**
 * Restore an archived item
 */
export async function restoreItem(
  prisma: PrismaClient,
  itemId: string,
  oldValues: Record<string, unknown>
): Promise<void> {
  await prisma.catalogItem.update({
    where: { id: itemId },
    data: { archivedAt: null },
  });

  // Log the restore
  await prisma.catalogChange.create({
    data: {
      list: 'catalog_items',
      recordId: itemId,
      action: 'RESTORE',
      oldValues: oldValues as any,
      newValues: { archivedAt: null } as any,
    },
  });
}

/**
 * Log a catalog change for the audit trail
 */
export async function logChange(
  prisma: PrismaClient,
  list: string,
  recordId: string,
  action: 'CREATE' | 'EDIT' | 'ARCHIVE' | 'RESTORE' | 'DELETE',
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown>
): Promise<void> {
  await prisma.catalogChange.create({
    data: {
      list,
      recordId,
      action,
      oldValues: oldValues as any,
      newValues: newValues as any,
    },
  });

  // Queue a CATALOG_UPDATED outbox message for the bot to reload
  await prisma.outbox.create({
    data: {
      type: 'CATALOG_UPDATED',
      payload: { changedList: list },
    },
  });
}
