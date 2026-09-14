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
