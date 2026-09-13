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
