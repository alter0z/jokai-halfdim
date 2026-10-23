/**
 * Admin Catalog API: List & Create Catalog Items, Regions, Services, Characters
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateCatalogItem, logChange } from '@/core/catalog';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'items'; // items, regions, services, characters, payment_methods

    if (type === 'regions') {
      const regions = await prisma.region.findMany({ orderBy: { sort: 'asc' } });
      return NextResponse.json({ regions });
    }
    if (type === 'services') {
      const services = await prisma.service.findMany({ orderBy: { sort: 'asc' } });
      return NextResponse.json({ services });
    }
    if (type === 'characters') {
      const characters = await prisma.character.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ characters });
    }
    if (type === 'payment_methods') {
      const paymentMethods = await prisma.paymentMethod.findMany({ orderBy: { sort: 'asc' } });
      return NextResponse.json({ paymentMethods });
    }

    // Default: catalog items
    const serviceKey = searchParams.get('serviceKey');
    const regionKey = searchParams.get('regionKey');
    const search = searchParams.get('search');

    const where: any = { archivedAt: null };
    if (serviceKey) where.serviceKey = serviceKey;
    if (regionKey) where.regionKey = regionKey;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const items = await prisma.catalogItem.findMany({
      where,
      orderBy: [{ serviceKey: 'asc' }, { sort: 'asc' }],
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, serviceKey, regionKey, name, price, pricingType, minCharge, chapter, maxQty } = body;

    if (type === 'item') {
      const validation = validateCatalogItem({
        serviceKey,
        name,
        regionKey,
        price,
        pricingType,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
      }

      const newItem = await prisma.catalogItem.create({
        data: {
          serviceKey,
          regionKey: regionKey || null,
          name,
          price: Number(price) || 0,
          pricingType: pricingType || 'PERCENT',
          minCharge: minCharge ? Number(minCharge) : 5000,
          chapter: chapter || null,
          maxQty: maxQty ? Number(maxQty) : null,
          active: true,
        },
      });

      await logChange(prisma, 'catalog_items', newItem.id, 'CREATE', null, newItem as any);

      return NextResponse.json({ item: newItem }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  } catch (error: any) {
    console.error('Error creating catalog item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
