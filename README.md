# NOR Customer Portal

Dobbeltsidet portal til pris-check og benchmarking af NOR-produkter (fx Nor Express, Nor Economy).

## Scope (v1)

- **Kunde:** login, indtast forsendelse, se branded produktpriser, benchmark
- **Admin:** opret kundelogins, skift password, markup % pr. produkt pr. kunde, produktkatalog
- **Ikke i v1:** booking (kommer i næste sprint), direkte leverandør-booking

Kunder ser aldrig underliggende carriers (Interfjord, Atlantic, Cargoboard, …).  
Admin mapper hvert NOR-produkt til en intern `cost_source_key`.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Supabase Auth + Postgres
- Pricing: demo-engine nu; klar til TMS quote-API (`PRICING_MODE=tms`)

## Tre apps

Portalen er en selvstændig app under `BruseBrutal99/nexum-customer-portal`. Den forbinder:

| App | Rolle |
|-----|--------|
| **nexum-customer-portal** (dette repo) | Kunde-/admin-UI, markup, branded produkter |
| **Nexum-TMS** | Indkøbspriser via `POST /api/portal/quote-costs` (API-key) |
| **strom-forwarding** | Marketing-site med CTA «Kundeportal» |

Produktmapping (portal → TMS `cost_source_key`):

- `nor_express` → `cargoboard`
- `nor_economy` → `atlantic_trucking`

## Kom i gang

1. Opret et Supabase-projekt og kør migrationen i `supabase/migrations/`.
2. Kopiér `.env.example` → `.env.local` og udfyld nøgler.
3. Opret første admin (Supabase SQL + Auth):

```sql
-- Efter du har oprettet en user i Authentication → Users:
insert into public.portal_profiles (user_id, role, full_name)
values ('<auth-user-uuid>', 'admin', 'NOR Admin');
```

4. Installér og kør:

```bash
npm install
npm run dev
```

- Kunde: http://localhost:3000/login → `/app`
- Admin: http://localhost:3000/admin/login → `/admin`

### Live priser fra TMS

I Nexum-TMS (feature branch `feature/portal-quote-bridge`):

```env
PORTAL_QUOTE_API_KEY=<shared-secret>
PORTAL_TMS_COMPANY_ID=<nor-company-uuid>
```

I denne portal:

```env
PRICING_MODE=tms
TMS_QUOTE_API_URL=http://localhost:3001/api/portal/quote-costs
# eller https://nexum-tms.vercel.app/api/portal/quote-costs
TMS_QUOTE_API_KEY=<same-as-PORTAL_QUOTE_API_KEY>
```

Kør TMS på en anden port end portalen (fx `next dev -p 3001`), så quote-kaldet rammer bridge-endpointet.

## Prismodel

```
salgspris = indkøbspris × (1 + markup_pct / 100)
```

Markup sættes pr. **kunde × produkt**. Kun aktiverede produkter vises til kunden.

## Næste sprint

1. Booking fra portal → TMS  
2. Debtor-sync (`tms_debtor_id`)  
3. TMS → leverandør via API  

## Repo

https://github.com/BruseBrutal99/nexum-customer-portal
