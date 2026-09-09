export type PortalRole = "admin" | "customer";

export type PortalCustomer = {
  id: string;
  name: string;
  company_name: string;
  email: string | null;
  tms_debtor_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PortalProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  /** Internal carrier/cost engine key — never send to customer clients */
  cost_source_key: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerProductMarkup = {
  id: string;
  customer_id: string;
  product_id: string;
  markup_pct: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type PortalProfile = {
  user_id: string;
  role: PortalRole;
  customer_id: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ChargeBasis = "ldm" | "cbm";

export type ShipmentInput = {
  originCountry: string;
  originZip: string;
  originCity: string;
  destinationCountry: string;
  destinationZip: string;
  destinationCity: string;
  weightKg: number;
  colli: number;
  ldm: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  pickupDate?: string;
};

export type CustomerQuoteOffer = {
  productId: string;
  productCode: string;
  productName: string;
  description: string | null;
  currency: "DKK";
  totalAmount: number;
  transitHint: string | null;
  chargeBasis: ChargeBasis;
  chargeableQuantity: number;
  cbm: number;
};

export type AdminQuoteOffer = CustomerQuoteOffer & {
  costSourceKey: string;
  purchaseAmount: number;
  markupPct: number;
  marginAmount: number;
};
