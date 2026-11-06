/**
 * Seed script for Jokai
 *
 * Reads jokai.xlsx using raw rows and populates the database.
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regionKeys: Record<string, string> = {
  mondstadt: 'mondstadt',
  liyue: 'liyue',
  inazuma: 'inazuma',
  sumeru: 'sumeru',
  fontaine: 'fontaine',
  natlan: 'natlan',
  'nod krai': 'nod-krai',
  'nod-krai': 'nod-krai',
  snezhnaya: 'snezhnaya',
  sneznahya: 'snezhnaya',
};

function normalizeRegion(region: string): string {
  if (!region) return '';
  return regionKeys[region.trim().toLowerCase()] || region.trim().toLowerCase().replace(/\s+/g, '-');
}

const actRoman: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
  6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI',
};

async function seed() {
  const xlsxModule = await import('xlsx');
  const xlsx = xlsxModule.default ?? xlsxModule;
  const xlsxPath = path.join(__dirname, '..', 'docs', 'jokai.xlsx');
  const workbook = xlsx.readFile(xlsxPath);

  console.log('Seeding regions...');
  const regions = [
    { key: 'mondstadt', name: 'Mondstadt', sort: 1 },
    { key: 'liyue', name: 'Liyue', sort: 2 },
    { key: 'inazuma', name: 'Inazuma', sort: 3 },
    { key: 'sumeru', name: 'Sumeru', sort: 4 },
    { key: 'fontaine', name: 'Fontaine', sort: 5 },
    { key: 'natlan', name: 'Natlan', sort: 6 },
    { key: 'nod-krai', name: 'Nod-Krai', sort: 7 },
    { key: 'snezhnaya', name: 'Snezhnaya', sort: 8 },
  ];
  for (const r of regions) {
    await prisma.region.upsert({ where: { key: r.key }, update: {}, create: r });
  }

  console.log('Seeding services...');
  const services = [
    { key: 'exploration', name: 'Exploration', pricingType: 'PERCENT', description: 'Exploration services per area', sort: 1 },
    { key: 'archon_quest', name: 'Archon Quest', pricingType: 'FLAT', description: 'Archon quest completion', sort: 2 },
    { key: 'world_quest', name: 'World Quest', pricingType: 'FLAT', description: 'World quest completion', sort: 3 },
    { key: 'material', name: 'Material Farming', pricingType: 'PER_UNIT', description: 'Material farming services', sort: 4 },
    { key: 'build_guide', name: 'Build Guide', pricingType: 'CUSTOM', description: 'Character build guides', sort: 5 },
    { key: 'other', name: 'Other', pricingType: 'CUSTOM', description: 'Other services', sort: 6 },
  ];
  for (const s of services) {
    await prisma.service.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log('Seeding settings...');
  const settings = [
    { key: 'shop_status', value: { isOpen: true } },
    { key: 'queue_limit', value: { limit: 10 } },
    { key: 'first_order_limit', value: { limit: 200000, enabled: true } },
    { key: 'exploration_minimum', value: { amount: 5000 } },
  ];
  for (const st of settings) {
    await prisma.setting.upsert({ where: { key: st.key }, update: {}, create: st });
  }

  console.log('Seeding exploration areas...');
  const exploreRows: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets['Explore'], { header: 1 });
  let currentRegion = '';
  let countExplore = 0;
  for (let i = 2; i < exploreRows.length; i++) {
    const row = exploreRows[i];
    if (!row || row.length === 0) continue;
    const regionCol = row[0] ? String(row[0]).trim() : '';
    const locationCol = row[1] ? String(row[1]).trim() : '';
    const priceCol = row[2];

    if (regionCol) {
      currentRegion = normalizeRegion(regionCol);
    }
    if (!currentRegion || !locationCol || typeof priceCol !== 'number') continue;

    await prisma.catalogItem.upsert({
      where: {
        serviceKey_regionKey_name: {
          serviceKey: 'exploration',
          regionKey: currentRegion,
          name: locationCol,
        }
      },
      update: { price: priceCol },
      create: {
        serviceKey: 'exploration',
        regionKey: currentRegion,
        name: locationCol,
        price: priceCol,
        pricingType: 'PERCENT',
        minCharge: 5000,
        sort: countExplore,
      }
    });
    countExplore++;
  }
  console.log(`Seeded ${countExplore} exploration areas`);

  console.log('Seeding archon quests...');
  const questRows: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets['Quest'], { header: 1 });
  let currentQuestRegion = '';
  let countQuest = 0;
  for (let i = 2; i < questRows.length; i++) {
    const row = questRows[i];
    if (!row || row.length === 0) continue;
    const regionCol = row[0] ? String(row[0]).trim() : '';
    const titleCol = row[1] ? String(row[1]).trim() : '';
    const priceCol = row[2];

    if (regionCol) {
      currentQuestRegion = normalizeRegion(regionCol);
    }
    if (!currentQuestRegion || !titleCol || typeof priceCol !== 'number') continue;

    const chapterMatch = titleCol.match(/Chapter\s+(\d+)/i);
    let chapter = chapterMatch ? chapterMatch.string || '1' : '';
    let actNum = countQuest + 1;
    if (titleCol.toLowerCase().includes('prolog')) chapter = 'Prolog';

    await prisma.catalogItem.upsert({
      where: {
        serviceKey_regionKey_name: {
          serviceKey: 'archon_quest',
          regionKey: currentQuestRegion,
          name: titleCol,
        }
      },
      update: { price: priceCol },
      create: {
        serviceKey: 'archon_quest',
        regionKey: currentQuestRegion,
        name: titleCol,
        price: priceCol,
        pricingType: 'FLAT',
        chapter,
        actNumber: actNum <= 11 ? actRoman[actNum] : String(actNum),
        sort: countQuest,
      }
    });
    countQuest++;
  }
  console.log(`Seeded ${countQuest} archon quests`);

  console.log('Seeding world quests...');
  const worldQuests = regions.map(r => ({ regionKey: r.key, name: 'Any World Quest', price: 10000 }));
  for (const wq of worldQuests) {
    await prisma.catalogItem.upsert({
      where: {
        serviceKey_regionKey_name: {
          serviceKey: 'world_quest',
          regionKey: wq.regionKey,
          name: wq.name,
        }
      },
      update: {},
      create: {
        serviceKey: 'world_quest',
        regionKey: wq.regionKey,
        name: wq.name,
        price: wq.price,
        pricingType: 'FLAT',
        sort: 0,
      }
    });
  }

  console.log('Seeding materials...');
  const materialRows: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets['Material'], { header: 1 });
  let countMaterial = 0;
  for (let i = 1; i < materialRows.length; i++) {
    const row = materialRows[i];
    if (!row || row.length === 0) continue;
    const nameCol = row[2] ? String(row[2]).trim() : '';
    const priceCol = typeof row[5] === 'number' ? row[5] : (typeof row[13] === 'number' ? row[13] : 120);
    const qtyChara = typeof row[6] === 'number' ? row[6] : 168;
    const maxQty = typeof row[7] === 'number' ? row[7] : 200;

    if (!nameCol) continue;

    await prisma.catalogItem.upsert({
      where: {
        serviceKey_regionKey_name: {
          serviceKey: 'material',
          regionKey: '',
          name: nameCol,
        }
      },
      update: { price: priceCol, maxQty, qtyPerChar: qtyChara },
      create: {
        serviceKey: 'material',
        regionKey: null,
        name: nameCol,
        price: priceCol,
        pricingType: 'PER_UNIT',
        maxQty,
        qtyPerChar: qtyChara,
        sort: countMaterial,
      }
    });
    countMaterial++;
  }
  console.log(`Seeded ${countMaterial} materials`);

  console.log('Seeding characters...');
  const charaRows: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets['Chara Data'], { header: 1 });
  let currentRarity = 5;
  let countChara = 0;
  for (let i = 2; i < charaRows.length; i++) {
    const row = charaRows[i];
    if (!row || row.length === 0) continue;
    const col0 = row[0] ? String(row[0]).trim() : '';
    if (col0.includes('Karakter B4')) {
      currentRarity = 4;
      continue;
    }
    if (col0 === 'Karakter' || !col0) continue;

    const name = col0;
    const element = row[1] ? String(row[1]).trim() : '';
    const weapon = row[2] ? String(row[2]).trim() : '';
    const scaling = row[3] ? String(row[3]).trim() : '';
    const minCrCd = row[4] ? String(row[4]).trim() : '';
    const minEr = row[5] ? String(row[5]).trim() : '';
    const minEm = row[6] ? String(row[6]).trim() : '';
    const minAtk = row[7] ? String(row[7]).trim() : '';
    const minHp = row[8] ? String(row[8]).trim() : '';
    const minDef = row[9] ? String(row[9]).trim() : '';
    const talents = row[10] ? String(row[10]).trim() : '';
    const mainStat = row[11] ? String(row[11]).trim() : '';

    await prisma.character.upsert({
      where: { name },
      update: { rarity: currentRarity, element, weapon },
      create: {
        name,
        rarity: currentRarity,
        element,
        weapon,
        scaling,
        statMinCr: minCrCd.split('/')[0] || '',
        statMinCd: minCrCd.split('/')[1] || '',
        statEr: minEr,
        statEm: minEm,
        statAtk: minAtk,
        statHp: minHp,
        statDef: minDef,
        talents,
        mainStat,
        sort: countChara,
      }
    });
    countChara++;
  }
  console.log(`Seeded ${countChara} characters`);
  console.log('Seed completed successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
