import { createServiceClient } from "@/lib/supabase/admin";
import { quotePurchaseCostsBatch } from "@/lib/pricing/purchase";
import { chargeBasisForProduct, cbmFromDims } from "@/lib/pricing/chargeable";
import type {
  AdminQuoteOffer,
  CustomerQuoteOffer,
  PortalProduct,
  ShipmentInput,
} from "@/types/domain";

type MarkupRow = {
  product_id: string;
  markup_pct: number;
  is_enabled: boolean;
  portal_products: PortalProduct | PortalProduct[] | null;
};

function unwrapProduct(
  value: PortalProduct | PortalProduct[] | null,
): PortalProduct | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function applyMarkup(purchaseAmount: number, markupPct: number) {
  const total = Math.round(purchaseAmount * (1 + markupPct / 100) * 100) / 100;
  return {
    totalAmount: total,
    marginAmount: Math.round((total - purchaseAmount) * 100) / 100,
  };
}

function toCustomerOffers(
  offers: AdminQuoteOffer[],
  includeAdminBreakdown?: boolean,
): CustomerQuoteOffer[] | AdminQuoteOffer[] {
  const sorted = [...offers].sort((a, b) => a.totalAmount - b.totalAmount);
  if (includeAdminBreakdown) return sorted;
  return sorted.map(
    ({
      productId,
      productCode,
      productName,
      description,
      currency,
      totalAmount,
      transitHint,
      chargeBasis,
      chargeableQuantity,
      cbm,
      offerId,
    }): CustomerQuoteOffer => ({
      productId,
      productCode,
      productName,
      description,
      currency,
      totalAmount,
      transitHint,
      chargeBasis,
      chargeableQuantity,
      cbm,
      offerId,
    }),
  );
}

function guestMarkupPct() {
  const raw = Number(process.env.PUBLIC_GUEST_MARKUP_PCT ?? "35");
  if (!Number.isFinite(raw) || raw < 0) return 35;
  return Math.min(raw, 500);
}

export async function quoteForCustomer(params: {
  customerId: string;
  shipment: ShipmentInput;
  includeAdminBreakdown?: boolean;
}): Promise<CustomerQuoteOffer[] | AdminQuoteOffer[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("customer_product_markups")
    .select(
      "product_id, markup_pct, is_enabled, portal_products ( id, code, name, description, cost_source_key, sort_order, is_active, created_at, updated_at )",
    )
    .eq("customer_id", params.customerId)
    .eq("is_enabled", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as MarkupRow[];
  const products: { row: MarkupRow; product: PortalProduct }[] = [];

  for (const row of rows) {
    const product = unwrapProduct(row.portal_products);
    if (!product || !product.is_active) continue;
    products.push({ row, product });
  }

  const costKeys = products.map((p) => p.product.cost_source_key);
  const purchaseBySource = await quotePurchaseCostsBatch(
    params.shipment,
    costKeys,
  );

  const cbm = params.shipment.goodsLines.reduce(
    (s, g) => s + (g.cbm || cbmFromDims(g.lengthCm, g.widthCm, g.heightCm, g.quantity)),
    0,
  );

  const offers: AdminQuoteOffer[] = [];

  for (const { row, product } of products) {
    const purchase = purchaseBySource.get(product.cost_source_key);
    if (!purchase) {
      throw new Error(`Mangler indkøbspris for ${product.name}`);
    }

    const priced = applyMarkup(purchase.purchaseAmount, Number(row.markup_pct));
    const chargeBasis = chargeBasisForProduct(product.code);

    offers.push({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      description: product.description,
      currency: "DKK",
      totalAmount: priced.totalAmount,
      transitHint: purchase.transitHint,
      chargeBasis,
      chargeableQuantity:
        chargeBasis === "cbm"
          ? Number(cbm.toFixed(4))
          : purchase.chargeableQuantity || params.shipment.ldm,
      cbm: Number(cbm.toFixed(4)),
      offerId: purchase.offerId ?? null,
      costSourceKey: product.cost_source_key,
      purchaseAmount: purchase.purchaseAmount,
      markupPct: Number(row.markup_pct),
      marginAmount: priced.marginAmount,
    });
  }

  return toCustomerOffers(offers, params.includeAdminBreakdown);
}

/** Public homepage quotes — higher flat markup than logged-in customers */
export async function quoteForGuest(params: {
  shipment: ShipmentInput;
}): Promise<CustomerQuoteOffer[]> {
  const supabase = createServiceClient();
  const markupPct = guestMarkupPct();

  let { data, error } = await supabase
    .from("portal_products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(error.message);
  }

  if (!(data ?? []).length) {
    const { DEFAULT_PRODUCTS } = await import("@/lib/products/defaults");
    await supabase
      .from("portal_products")
      .upsert([...DEFAULT_PRODUCTS], { onConflict: "code" });
    const seeded = await supabase
      .from("portal_products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    data = seeded.data;
    error = seeded.error;
    if (error) throw new Error(error.message);
  }

  const products = (data ?? []) as PortalProduct[];
  if (!products.length) {
    return [];
  }

  const purchaseBySource = await quotePurchaseCostsBatch(
    params.shipment,
    products.map((p) => p.cost_source_key),
  );

  const cbm = params.shipment.goodsLines.reduce(
    (s, g) => s + (g.cbm || cbmFromDims(g.lengthCm, g.widthCm, g.heightCm, g.quantity)),
    0,
  );

  const offers: AdminQuoteOffer[] = [];

  for (const product of products) {
    const purchase = purchaseBySource.get(product.cost_source_key);
    if (!purchase) continue;

    const priced = applyMarkup(purchase.purchaseAmount, markupPct);
    const chargeBasis = chargeBasisForProduct(product.code);

    offers.push({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      description: product.description,
      currency: "DKK",
      totalAmount: priced.totalAmount,
      transitHint: purchase.transitHint,
      chargeBasis,
      chargeableQuantity:
        chargeBasis === "cbm"
          ? Number(cbm.toFixed(4))
          : purchase.chargeableQuantity || params.shipment.ldm,
      cbm: Number(cbm.toFixed(4)),
      offerId: purchase.offerId ?? null,
      costSourceKey: product.cost_source_key,
      purchaseAmount: purchase.purchaseAmount,
      markupPct,
      marginAmount: priced.marginAmount,
    });
  }

  return toCustomerOffers(offers, false) as CustomerQuoteOffer[];
}
