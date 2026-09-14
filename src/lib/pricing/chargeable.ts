/** Same CBM helper as TMS goods-line-helpers */
export function cbmFromDims(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  quantity: number,
) {
  const unitCbm = (lengthCm * widthCm * heightCm) / 1_000_000;
  const total = unitCbm * (Number.isFinite(quantity) ? quantity : 1);
  return Number(total.toFixed(4));
}

/** Floor-area LDM: (L×W in m) / 2.4 × quantity — used when UI hides LDM. */
export function ldmFromDims(
  lengthCm: number,
  widthCm: number,
  quantity: number,
) {
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const floorM2 = (lengthCm / 100) * (widthCm / 100);
  const total = (floorM2 / 2.4) * qty;
  return Math.max(Number(total.toFixed(3)), 0.01);
}

export type ChargeBasis = "ldm" | "cbm";

/** Product code → how the mapped supplier rates the shipment (check-price style) */
export const PRODUCT_CHARGE_BASIS: Record<string, ChargeBasis> = {
  nor_express: "cbm",
  nor_economy: "ldm",
};

export function chargeBasisForProduct(code: string): ChargeBasis {
  return PRODUCT_CHARGE_BASIS[code] ?? "ldm";
}

/**
 * Chargeable quantity for demo quotes — mirrors TMS carrier engines at a high level.
 * Live mode: supplier/TMS applies volumetric rules themselves.
 */
export function chargeableQuantity(params: {
  basis: ChargeBasis;
  weightKg: number;
  ldm: number;
  colli: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}): { quantity: number; unit: ChargeBasis; cbm: number } {
  const cbm = cbmFromDims(
    params.lengthCm,
    params.widthCm,
    params.heightCm,
    params.colli,
  );

  if (params.basis === "cbm") {
    return { quantity: Math.max(cbm, 0.01), unit: "cbm", cbm };
  }

  // Atlantic/Shipco-style: max(stated LDM, weight/1650)
  const weightLdm = params.weightKg / 1650;
  const quantity = Math.max(params.ldm, weightLdm, 0.01);
  return { quantity: Number(quantity.toFixed(3)), unit: "ldm", cbm };
}
