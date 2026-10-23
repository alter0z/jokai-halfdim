# Jokai Halfdim

> Genshin Impact piloting service (joki) — Discord bot + dashboard

## Setup

1. **Prerequisites**
   - Node.js 20+ LTS
   - Docker + Docker Compose (for PostgreSQL)
   - Discord bot token (see Phase 0 in dev plan)

2. **Clone and install**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your token and database URL
   ```

4. **Database**
   ```bash
   docker-compose up -d postgres
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Development**
   ```bash
   npm run dev:bot      # Bot (discord.js)
   npm run dev:web      # Website (Next.js)
   ```

6. **Testing**
   ```bash
   npm test              # Run all tests
   npm run test:watch    # Watch mode
   ```

## Project Structure

```
src/
├── core/              # Pricing, orders, crypto (no Discord/Next.js)
├── bot/               # discord.js commands, interactions, jobs
└── app/               # Next.js dashboard, API routes, login form

prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Import data from jokai.xlsx
```

## Key Files

- **Pricing engine**: `src/core/pricing.ts`
  - Pure function: `quote(cart, catalog) → { lines, subtotal, total }`
  - Golden tests in `src/core/pricing.test.ts`

- **Order state machine**: `src/core/orders.ts`
  - All status transitions defined
  - Used by both bot and website

- **Encryption**: `src/core/crypto.ts`
  - AES-256-GCM for credentials
  - Never stored plaintext

- **Database**: `src/db/index.ts` (Prisma client)

## Development Plan

See `jokai-dev-plan.md` (from WhatsApp) for full spec.

**Phases:**
0. Setup (1 day)
1. Foundation: repo, Prisma, pricing tests (2 days)
2. Bot prices: `/price`, cart, `/price-list` (2–3 days)
3. Bot orders: place, accept, thread, queue (3 days)
4. Website: dashboard, work page, login (3–4 days)
5. Data management: CRUD for everything (2–3 days)
6. Payment & closing: invoice, `/pay`, overdue (2 days)
7. Deploy & UAT (2–3 days)
8. Launch & monitor (1 week)

**MVP ≈ 17–21 focused days (6–7 weeks part-time)**

## Golden Tests (§7 of dev plan)

All region totals and pricing examples:
- Avidya Forest (Rp40,000) from 63% → **Rp14,800** ✓
- Windwail Highland (Rp15,000) from 90% → **Rp5,000** (minimum) ✓
- 1-character ascension: 168 local + 84 enemy → **Rp32,760** ✓
- Example cart (§5.3) → **Rp179,800** ✓

Run: `npm test`

## Discord Permissions

Bot needs:
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Create Public/Private Threads
- Manage Threads

See §10 for security checklist.

## Data Import

The schema seeds from `jokai.xlsx`:
- **Explore** sheet → exploration areas (69 areas, 8 regions)
- **Quest** sheet → Archon quests (47 acts)
- **Material** sheet → farming items
- **Chara Data** sheet → build guides (118 characters)

Run: `npm run db:seed`

Afterward, manage everything on the website (§9.2). The sheet is retired.

## Deployment

See §13 of dev plan for:
- VPS requirements (2GB RAM, Jakarta/Singapore)
- Docker Compose setup
- HTTPS with Caddy
- Nightly backups (`pg_dump`)
- Heartbeat monitor

## License

Private project for Jokai service operator.
