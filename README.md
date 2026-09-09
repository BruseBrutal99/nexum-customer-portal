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

## Prismodel

```
salgspris = indkøbspris × (1 + markup_pct / 100)
```

Markup sættes pr. **kunde × produkt**. Kun aktiverede produkter vises til kunden.

## Næste sprint

1. Live indkøbspriser fra Nexum TMS API  
2. Booking fra portal → TMS  
3. TMS → leverandør via API  

## Repo

Lokalt git-repo. Push til GitHub når I er klar (fx under samme org som Nexum-TMS).
