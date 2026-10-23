/**
 * Admin Single Catalog Item API: Update, Archive, Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { archiveItem, deleteItem, canDelete, logChange } from '@/core/catalog';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, price, active, action, minCharge } = body;

    const oldItem = await prisma.catalogItem.findUnique({ where: { id } });
    if (!oldItem) {
      return NextResponse.json({ error: 'Catalog item not found' }, { status: 404 });
    }

    if (action === 'ARCHIVE') {
      await archiveItem(prisma, id, oldItem as any);
      return NextResponse.json({ success: true, message: 'Item archived' });
    }

    if (action === 'RESTORE') {
      await prisma.catalogItem.update({
        where: { id },
        data: { archivedAt: null },
      });
      await logChange(prisma, 'catalog_items', id, 'RESTORE', oldItem as any, { archivedAt: null });
      return NextResponse.json({ success: true, message: 'Item restored' });
    }

    if (action === 'DELETE') {
      const deletable = await canDelete(prisma, id);
      if (!deletable) {
        return NextResponse.json(
          { error: 'Cannot delete item that has been used in orders. Archive it instead.' },
          { status: 400 }
        );
      }
      await deleteItem(prisma, id, oldItem as any);
      return NextResponse.json({ success: true, message: 'Item deleted' });
    }

    // Standard update
    const updated = await prisma.catalogItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name : oldItem.name,
        price: price !== undefined ? Number(price) : oldItem.price,
        active: active !== undefined ? Boolean(active) : oldItem.active,
        minCharge: minCharge !== undefined ? Number(minCharge) : oldItem.minCharge,
      },
    });

    await logChange(prisma, 'catalog_items', id, 'EDIT', oldItem as any, updated as any);

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    console.error('Error updating catalog item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
