export type PortalRole = "admin" | "customer";

export type BillingMode = "prepaid" | "invoice_credit";

export type PortalCustomer = {
  id: string;
  name: string;
  company_name: string;
  email: string | null;
  tms_debtor_id: string | null;
  billing_mode: BillingMode;
  is_active: boolean;
  address: string | null;
  zip: string | null;
  city: string | null;
  country: string | null;
  cvr: string | null;
  contact_phone: string | null;
  invoice_email: string | null;
  finance_email: string | null;
  invoice_language: string | null;
  default_currency: string | null;
  bank_name: string | null;
  bank_reg_no: string | null;
  bank_account: string | null;
  iban: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalPaymentStatus =
  | "awaiting_payment"
  | "credit_ok"
  | "paid"
  | "cancelled";

export type PortalBookingShipment = {
  originCountry?: string;
  originZip?: string;
  originCity?: string;
  originAddress?: string;
  destinationCountry?: string;
  destinationZip?: string;
  destinationCity?: string;
  destinationAddress?: string;
  pickupDate?: string;
  goodsLines?: unknown;
};

export type PortalBookingRequest = {
  id: string;
  tms_booking_id: string | null;
  tms_booking_number: string | null;
  customer_id: string | null;
  payment_status: PortalPaymentStatus;
  product_code: string;
  product_name: string;
  sell_amount_dkk: number;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  shipment: PortalBookingShipment;
  offer_snapshot?: Record<string, unknown>;
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

export type GoodsLineInput = {
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  ldm: number;
  cbm: number;
};

export type ShipmentInput = {
  originCountry: string;
  originZip: string;
  originCity: string;
  originAddress: string;
  destinationCountry: string;
  destinationZip: string;
  destinationCity: string;
  destinationAddress: string;
  goodsLines: GoodsLineInput[];
  /** Aggregates of goodsLines (compat with older helpers) */
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
  offerId?: string | null;
};

export type AdminQuoteOffer = CustomerQuoteOffer & {
  costSourceKey: string;
  purchaseAmount: number;
  markupPct: number;
  marginAmount: number;
};
