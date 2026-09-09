import type { ShipmentInput } from "@/types/domain";
import {
  chargeableQuantity,
  chargeBasisForProduct,
  type ChargeBasis,
} from "@/lib/pricing/chargeable";

export type PurchaseQuote = {
  costSourceKey: string;
  currency: "DKK";
  purchaseAmount: number;
  transitHint: string | null;
  chargeBasis: ChargeBasis;
  chargeableQuantity: number;
  cbm: number;
};

const BASE_PER_LDM: Record<string, number> = {
  atlantic_trucking: 780,
  shipco_sales: 1100,
  interfjord: 850,
};

const BASE_PER_CBM: Record<string, number> = {
  cargoboard: 1850,
};

const TRANSIT_HINTS: Record<string, string> = {
  cargoboard: "Typisk 1–2 arbejdsdage",
  atlantic_trucking: "Typisk 2–3 arbejdsdage",
  interfjord: "Typisk 2–4 arbejdsdage",
};

/**
 * Demo engine approximating check-price until live TMS/supplier quotes.
 * Product charge basis (ldm|cbm) selects the metric — volumetric factors
 * are left to suppliers in production.
 */
export async function quoteDemoPurchase(
  costSourceKey: string,
  shipment: ShipmentInput,
  productCode: string,
): Promise<PurchaseQuote> {
  const chargeBasis = chargeBasisForProduct(productCode);
  const charged = chargeableQuantity({
    basis: chargeBasis,
    weightKg: shipment.weightKg,
    ldm: shipment.ldm,
    colli: shipment.colli,
    lengthCm: shipment.lengthCm,
    widthCm: shipment.widthCm,
    heightCm: shipment.heightCm,
  });

  const unitRate =
    chargeBasis === "cbm"
      ? (BASE_PER_CBM[costSourceKey] ?? 1800)
      : (BASE_PER_LDM[costSourceKey] ?? 800);

  const laneFactor =
    shipment.originCountry === shipment.destinationCountry ? 1 : 1.18;
  const purchaseAmount =
    Math.round(charged.quantity * unitRate * laneFactor * 100) / 100;

  return {
    costSourceKey,
    currency: "DKK",
    purchaseAmount,
    transitHint: TRANSIT_HINTS[costSourceKey] ?? null,
    chargeBasis,
    chargeableQuantity: charged.quantity,
    cbm: charged.cbm,
  };
}
