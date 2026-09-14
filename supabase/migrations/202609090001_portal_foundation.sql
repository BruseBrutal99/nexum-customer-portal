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
  -- Internal only — never expose to customer APIs/UI
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

-- Seed branded products (cost_source_key maps to TMS/carrier engines — never shown to customers)
insert into public.portal_products (code, name, description, cost_source_key, sort_order)
values
  (
    'nor_express',
    'Nor Express',
    'Hurtigere levering med prioriteret håndtering.',
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
