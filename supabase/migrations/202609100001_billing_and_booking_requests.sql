-- Billing mode + portal booking requests (payment gate before carrier book)

alter table public.portal_customers
  add column if not exists billing_mode text not null default 'prepaid'
    check (billing_mode in ('prepaid', 'invoice_credit'));

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

create trigger portal_booking_requests_updated_at
before update on public.portal_booking_requests
for each row execute function public.set_updated_at();

alter table public.portal_booking_requests enable row level security;

create policy portal_booking_requests_admin_all on public.portal_booking_requests
  for all using (public.is_portal_admin())
  with check (public.is_portal_admin());
