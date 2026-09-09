-- Ensure default NOR products exist (safe to re-run)
insert into public.portal_products (code, name, description, cost_source_key, sort_order, is_active)
values
  (
    'nor_express',
    'Nor Express',
    'Hurtigere levering med prioriteret håndtering.',
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
