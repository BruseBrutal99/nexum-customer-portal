-- =============================================================================
-- Nor Courier / Nexum Customer Portal - full schema for Supabase SQL editor
-- Paste this entire file once. Safe to re-run (idempotent).
-- Order: foundation -> NOR product seed -> billing/booking -> profile/orders
-- Do not use as a timestamped CLI migration; use the numbered files for that.
-- =============================================================================

-- >>> BEGIN 202609090001_portal_foundation.sql
-- Nexum Customer Portal schema (v1: quote + benchmark)
-- Products are customer-facing brands. Carrier/cost sources stay admin-only.
-- Idempotent: safe to re-run in Supabase SQL editor

create extension if not exists "pgcrypto";

do $$
begin
  create type public.portal_role as enum ('admin', 'customer');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.portal_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null,
  email text,
  tms_debtor_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  -- Internal only â€” never expose to customer APIs/UI
  cost_source_key text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_product_markups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.portal_customers (id) on delete cascade,
  product_id uuid not null references public.portal_products (id) on delete cascade,
  markup_pct numeric(8, 3) not null default 0
    check (markup_pct >= 0 and markup_pct <= 500),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists public.portal_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.portal_role not null,
  customer_id uuid references public.portal_customers (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_profiles_customer_role_chk check (
    (role = 'admin' and customer_id is null)
    or (role = 'customer' and customer_id is not null)
  )
);

create index if not exists portal_profiles_customer_id_idx on public.portal_profiles (customer_id);
create index if not exists customer_product_markups_customer_id_idx on public.customer_product_markups (customer_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portal_customers_updated_at on public.portal_customers;
create trigger portal_customers_updated_at
before update on public.portal_customers
for each row execute function public.set_updated_at();

drop trigger if exists portal_products_updated_at on public.portal_products;
create trigger portal_products_updated_at
before update on public.portal_products
for each row execute function public.set_updated_at();

drop trigger if exists customer_product_markups_updated_at on public.customer_product_markups;
create trigger customer_product_markups_updated_at
before update on public.customer_product_markups
for each row execute function public.set_updated_at();

drop trigger if exists portal_profiles_updated_at on public.portal_profiles;
create trigger portal_profiles_updated_at
before update on public.portal_profiles
for each row execute function public.set_updated_at();

alter table public.portal_customers enable row level security;
alter table public.portal_products enable row level security;
alter table public.customer_product_markups enable row level security;
alter table public.portal_profiles enable row level security;

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.portal_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.current_portal_customer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.customer_id from public.portal_profiles p
  where p.user_id = auth.uid() and p.role = 'customer'
  limit 1;
$$;

-- Profiles: users see themselves; admins see all
drop policy if exists portal_profiles_select_own_or_admin on public.portal_profiles;
create policy portal_profiles_select_own_or_admin on public.portal_profiles
  for select using (user_id = auth.uid() or public.is_portal_admin());

drop policy if exists portal_profiles_admin_write on public.portal_profiles;
create policy portal_profiles_admin_write on public.portal_profiles
  for all using (public.is_portal_admin()) with check (public.is_portal_admin());

-- Customers: admin full access; customer users read own company
drop policy if exists portal_customers_admin_all on public.portal_customers;
create policy portal_customers_admin_all on public.portal_customers
  for all using (public.is_portal_admin()) with check (public.is_portal_admin());

drop policy if exists portal_customers_self_select on public.portal_customers;
create policy portal_customers_self_select on public.portal_customers
  for select using (id = public.current_portal_customer_id());

-- Products: admins manage; customers only see active products they have enabled markups for
drop policy if exists portal_products_admin_all on public.portal_products;
create policy portal_products_admin_all on public.portal_products
  for all using (public.is_portal_admin()) with check (public.is_portal_admin());

drop policy if exists portal_products_customer_select on public.portal_products;
create policy portal_products_customer_select on public.portal_products
  for select using (
    is_active
    and exists (
      select 1 from public.customer_product_markups m
      where m.product_id = portal_products.id
        and m.customer_id = public.current_portal_customer_id()
        and m.is_enabled
    )
  );

-- Markups: admin full; customers never see markup rows (prices applied server-side)
drop policy if exists customer_product_markups_admin_all on public.customer_product_markups;
create policy customer_product_markups_admin_all on public.customer_product_markups
  for all using (public.is_portal_admin()) with check (public.is_portal_admin());

-- Seed branded products (cost_source_key maps to TMS/carrier engines â€” never shown to customers)
insert into public.portal_products (code, name, description, cost_source_key, sort_order)
values
  (
    'nor_express',
    'Nor Express',
    'Hurtigere levering med prioriteret hÃ¥ndtering.',
    'cargoboard',
    10
  ),
  (
    'nor_economy',
    'Nor Economy',
    'Omkostningseffektiv groupage med standard transit.',
    'atlantic_trucking',
    20
  )
on conflict (code) do nothing;
-- <<< END 202609090001_portal_foundation.sql

-- >>> BEGIN 202609090002_seed_nor_products.sql
-- Ensure default NOR products exist (safe to re-run)
insert into public.portal_products (code, name, description, cost_source_key, sort_order, is_active)
values
  (
    'nor_express',
    'Nor Express',
    'Hurtigere levering med prioriteret hÃ¥ndtering.',
    'cargoboard',
    10,
    true
  ),
  (
    'nor_economy',
    'Nor Economy',
    'Omkostningseffektiv groupage med standard transit.',
    'atlantic_trucking',
    20,
    true
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  cost_source_key = excluded.cost_source_key,
  sort_order = excluded.sort_order,
  is_active = true;
-- <<< END 202609090002_seed_nor_products.sql

-- >>> BEGIN 202609100001_billing_and_booking_requests.sql
-- Billing mode + portal booking requests (payment gate before carrier book)
-- Idempotent: safe to re-run in Supabase SQL editor
-- Requires 202609090001_portal_foundation.sql first (or RUN_ALL_PORTAL.sql)

do $$
begin
  if to_regclass('public.portal_customers') is null then
    raise exception
      'public.portal_customers does not exist. Run 202609090001_portal_foundation.sql first (or supabase/migrations/RUN_ALL_PORTAL.sql).';
  end if;
end $$;

alter table public.portal_customers
  add column if not exists billing_mode text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portal_customers_billing_mode_check'
  ) then
    alter table public.portal_customers
      add constraint portal_customers_billing_mode_check
      check (billing_mode in ('prepaid', 'invoice_credit'));
  end if;
end $$;

update public.portal_customers
set billing_mode = 'prepaid'
where billing_mode is null;

alter table public.portal_customers
  alter column billing_mode set default 'prepaid';

alter table public.portal_customers
  alter column billing_mode set not null;

create table if not exists public.portal_booking_requests (
  id uuid primary key default gen_random_uuid(),
  tms_booking_id text,
  tms_booking_number text,
  customer_id uuid references public.portal_customers (id) on delete set null,
  payment_status text not null default 'awaiting_payment'
    check (payment_status in ('awaiting_payment', 'credit_ok', 'paid', 'cancelled')),
  product_code text not null,
  product_name text not null,
  sell_amount_dkk numeric(12, 2) not null,
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  shipment jsonb not null default '{}'::jsonb,
  offer_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portal_booking_requests_payment_status_idx
  on public.portal_booking_requests (payment_status, created_at desc);

create index if not exists portal_booking_requests_customer_id_idx
  on public.portal_booking_requests (customer_id);

drop trigger if exists portal_booking_requests_updated_at on public.portal_booking_requests;
create trigger portal_booking_requests_updated_at
before update on public.portal_booking_requests
for each row execute function public.set_updated_at();

alter table public.portal_booking_requests enable row level security;

drop policy if exists portal_booking_requests_admin_all on public.portal_booking_requests;
create policy portal_booking_requests_admin_all on public.portal_booking_requests
  for all using (public.is_portal_admin())
  with check (public.is_portal_admin());
-- <<< END 202609100001_billing_and_booking_requests.sql

-- >>> BEGIN 202609130001_customer_portal_profile_and_orders.sql
-- Customer profile fields + customer RLS for orders/profile
-- Idempotent: safe to re-run in Supabase SQL editor
-- Requires foundation + billing first (or paste RUN_ALL_PORTAL.sql once)

do $$
begin
  if to_regclass('public.portal_customers') is null then
    raise exception
      'public.portal_customers does not exist. Run 202609090001_portal_foundation.sql first (or supabase/migrations/RUN_ALL_PORTAL.sql).';
  end if;
  if to_regclass('public.portal_booking_requests') is null then
    raise exception
      'public.portal_booking_requests does not exist. Run 202609100001_billing_and_booking_requests.sql first (or supabase/migrations/RUN_ALL_PORTAL.sql).';
  end if;
end $$;

alter table public.portal_customers
  add column if not exists address text,
  add column if not exists zip text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists cvr text,
  add column if not exists contact_phone text,
  add column if not exists invoice_email text,
  add column if not exists finance_email text,
  add column if not exists invoice_language text,
  add column if not exists default_currency text,
  add column if not exists bank_name text,
  add column if not exists bank_reg_no text,
  add column if not exists bank_account text,
  add column if not exists iban text;

update public.portal_customers
set country = coalesce(nullif(trim(country), ''), 'DK')
where country is null or trim(country) = '';

update public.portal_customers
set invoice_language = coalesce(nullif(trim(invoice_language), ''), 'da')
where invoice_language is null or trim(invoice_language) = '';

update public.portal_customers
set default_currency = coalesce(nullif(trim(default_currency), ''), 'DKK')
where default_currency is null or trim(default_currency) = '';

alter table public.portal_customers
  alter column country set default 'DK';

alter table public.portal_customers
  alter column invoice_language set default 'da';

alter table public.portal_customers
  alter column default_currency set default 'DKK';

-- Customers may update their own profile row (API still whitelists columns)
drop policy if exists portal_customers_self_update on public.portal_customers;
create policy portal_customers_self_update on public.portal_customers
  for update
  using (id = public.current_portal_customer_id())
  with check (id = public.current_portal_customer_id());

-- Customers may read their own booking requests
drop policy if exists portal_booking_requests_customer_select on public.portal_booking_requests;
create policy portal_booking_requests_customer_select on public.portal_booking_requests
  for select
  using (customer_id = public.current_portal_customer_id());
-- <<< END 202609130001_customer_portal_profile_and_orders.sql

