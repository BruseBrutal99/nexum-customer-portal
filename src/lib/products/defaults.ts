export const DEFAULT_PRODUCTS = [
  {
    code: "nor_express",
    name: "Nor Express",
    description: "Hurtigere levering. Prissat på CBM (leverandør håndterer volumenvægt).",
    cost_source_key: "cargoboard",
    sort_order: 10,
    is_active: true,
  },
  {
    code: "nor_economy",
    name: "Nor Economy",
    description: "Groupage. Prissat på LDM (leverandør håndterer volumenvægt).",
    cost_source_key: "atlantic_trucking",
    sort_order: 20,
    is_active: true,
  },
] as const;
