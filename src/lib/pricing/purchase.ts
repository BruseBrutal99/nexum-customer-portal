import type { ShipmentInput } from "@/types/domain";
import { chargeBasisForProduct } from "@/lib/pricing/chargeable";
import { quoteDemoPurchase, type PurchaseQuote } from "./demo-costs";

export type TmsBatchQuote = {
  costSourceKey: string;
  offerId?: string;
  currency: string;
  purchaseAmount: number;
  purchaseAmountDkk: number | null;
  transitHint: string | null;
  productLabel?: string | null;
  unavailableReason?: string | null;
  bookable?: boolean;
  chargeableLdm?: number | null;
};

export type TmsBatchResponse = {
  quotes: TmsBatchQuote[];
  warnings?: string[];
  chargeableLdm?: number | null;
  error?: string;
};

function tmsConfigured() {
  const mode = process.env.PRICING_MODE ?? "demo";
  const tmsUrl = process.env.TMS_QUOTE_API_URL?.trim();
  return mode === "tms" && Boolean(tmsUrl);
}

/**
 * One TMS call for all product cost sources (same engines as check-price).
 */
export async function quotePurchaseCostsBatch(
  shipment: ShipmentInput,
  costSourceKeys: string[],
): Promise<Map<string, PurchaseQuote>> {
  const uniqueKeys = [...new Set(costSourceKeys.filter(Boolean))];
  const map = new Map<string, PurchaseQuote>();

  if (!tmsConfigured()) {
    for (const key of uniqueKeys) {
      // productCode only affects demo charge basis mapping
      const productCode =
        key === "cargoboard" ? "nor_express" : "nor_economy";
      map.set(key, await quoteDemoPurchase(key, shipment, productCode));
    }
    return map;
  }

  const tmsUrl = process.env.TMS_QUOTE_API_URL!.trim();
  const tmsKey = process.env.TMS_QUOTE_API_KEY;

  const res = await fetch(tmsUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(tmsKey ? { authorization: `Bearer ${tmsKey}` } : {}),
    },
    body: JSON.stringify({
      shipment,
      costSourceKeys: uniqueKeys,
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as TmsBatchResponse;
  if (!res.ok) {
    throw new Error(data.error ?? `TMS quote failed (${res.status})`);
  }

  for (const key of uniqueKeys) {
    const matches = (data.quotes ?? []).filter((q) => q.costSourceKey === key);
    const best =
      matches.find((q) => (q.purchaseAmountDkk ?? 0) > 0 && q.bookable !== false) ??
      matches.find((q) => (q.purchaseAmountDkk ?? 0) > 0) ??
      matches[0];

    if (!best || best.purchaseAmountDkk == null || best.purchaseAmountDkk <= 0) {
      throw new Error(
        best?.unavailableReason ??
          `Ingen TMS-pris for ${key}${data.warnings?.length ? `: ${data.warnings.join("; ")}` : ""}`,
      );
    }

    const productCode =
      key === "cargoboard" ? "nor_express" : "nor_economy";

    map.set(key, {
      costSourceKey: key,
      currency: "DKK",
      purchaseAmount: best.purchaseAmountDkk,
      transitHint: best.transitHint,
      chargeBasis: chargeBasisForProduct(productCode),
      chargeableQuantity: best.chargeableLdm ?? data.chargeableLdm ?? 0,
      cbm: 0,
    });
  }

  return map;
}

/**
 * Fetches purchase (buy-side) quotes. Prefer batch helper from quote.ts.
 */
export async function quotePurchaseCost(
  costSourceKey: string,
  shipment: ShipmentInput,
  productCode: string,
): Promise<PurchaseQuote> {
  if (!tmsConfigured()) {
    return quoteDemoPurchase(costSourceKey, shipment, productCode);
  }

  const batch = await quotePurchaseCostsBatch(shipment, [costSourceKey]);
  const quote = batch.get(costSourceKey);
  if (!quote) {
    throw new Error(`Ingen TMS-pris for ${costSourceKey}`);
  }
  return {
    ...quote,
    chargeBasis: chargeBasisForProduct(productCode),
  };
}
