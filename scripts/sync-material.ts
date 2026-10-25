/**
 * Sync Material Data from Excel to Database
 * Reads from docs/jokai.xlsx and updates CatalogItem table
 */

import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MaterialRow {
  Tipe: string;
  'Material ': string;
  Unit: string;
  Price: number;
  'Qty Chara': number;
  'Maks order': number;
  'Full price': number;
  'Price 1 chara ascend material'?: number;
}

async function syncMaterials() {
  console.log('📖 Reading Excel file...');
  const wb = XLSX.readFile('docs/jokai.xlsx');
  const materialSheet = wb.Sheets['Material'];
  const materials = XLSX.utils.sheet_to_json(materialSheet) as MaterialRow[];

  // Filter out empty rows
  const validMaterials = materials.filter(
    row => row.Tipe && row['Material '] && row.Price
  );

  console.log(`✅ Found ${validMaterials.length} material items in Excel`);

  // Ensure material service exists
  await prisma.service.upsert({
    where: { key: 'material' },
    create: {
      key: 'material',
      name: 'Material Farming',
      pricingType: 'PER_UNIT',
      description: 'Farm materials for character ascension',
      sort: 3,
      active: true,
    },
    update: {},
  });

  let created = 0;
  let updated = 0;

  for (let i = 0; i < validMaterials.length; i++) {
    const row = validMaterials[i];
    const name = row['Material '].trim();
    const price = Math.floor(row.Price);
    const maxQty = row['Maks order'] || null;
    const qtyPerChar = row['Qty Chara'] || null;

    try {
      const existing = await prisma.catalogItem.findFirst({
        where: {
          serviceKey: 'material',
          name: name,
        },
      });

      if (existing) {
        await prisma.catalogItem.update({
          where: { id: existing.id },
          data: {
            price,
            maxQty,
            qtyPerChar,
            sort: i + 1,
            active: true,
            archivedAt: null,
          },
        });
        updated++;
      } else {
        await prisma.catalogItem.create({
          data: {
            serviceKey: 'material',
            name,
            price,
            pricingType: 'PER_UNIT',
            maxQty,
            qtyPerChar,
            sort: i + 1,
            active: true,
          },
        });
        created++;
      }

      if ((i + 1) % 20 === 0) {
        console.log(`⏳ Processed ${i + 1}/${validMaterials.length}...`);
      }
    } catch (error) {
      console.error(`❌ Error processing "${name}":`, error);
    }
  }

  console.log(`\n✅ Material sync complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total:   ${created + updated}`);
}

syncMaterials()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
