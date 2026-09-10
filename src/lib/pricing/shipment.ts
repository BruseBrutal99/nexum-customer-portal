import { z } from "zod";
import { cbmFromDims, ldmFromDims } from "@/lib/pricing/chargeable";
import type { GoodsLineInput, ShipmentInput } from "@/types/domain";

export const goodsLineSchema = z.object({
  quantity: z.coerce.number().int().positive().max(200),
  weightKg: z.coerce.number().positive().max(40000),
  lengthCm: z.coerce.number().positive().max(1200),
  widthCm: z.coerce.number().positive().max(1200),
  heightCm: z.coerce.number().positive().max(1200),
});

export const shipmentSchema = z
  .object({
    originCountry: z.string().min(2).max(2).transform((v) => v.toUpperCase()),
    originZip: z.string().trim().min(2).max(16),
    originCity: z.string().trim().min(1).max(80),
    originAddress: z.string().trim().min(1).max(160),
    destinationCountry: z
      .string()
      .min(2)
      .max(2)
      .transform((v) => v.toUpperCase()),
    destinationZip: z.string().trim().min(2).max(16),
    destinationCity: z.string().trim().min(1).max(80),
    destinationAddress: z.string().trim().min(1).max(160),
    goodsLines: z.array(goodsLineSchema).max(40).optional(),
    pickupDate: z.string().optional(),
    // Legacy single-line fields still accepted and expanded server-side
    weightKg: z.coerce.number().positive().max(40000).optional(),
    colli: z.coerce.number().int().positive().max(200).optional(),
    lengthCm: z.coerce.number().positive().max(1200).optional(),
    widthCm: z.coerce.number().positive().max(1200).optional(),
    heightCm: z.coerce.number().positive().max(1200).optional(),
    ldm: z.coerce.number().positive().max(40).optional(),
  })
  .transform((raw): ShipmentInput => {
    let goodsLines: GoodsLineInput[] = (raw.goodsLines ?? []).map((line) => {
      const cbm = cbmFromDims(
        line.lengthCm,
        line.widthCm,
        line.heightCm,
        line.quantity,
      );
      const ldm = ldmFromDims(line.lengthCm, line.widthCm, line.quantity);
      return {
        quantity: line.quantity,
        weightKg: line.weightKg,
        lengthCm: line.lengthCm,
        widthCm: line.widthCm,
        heightCm: line.heightCm,
        ldm,
        cbm,
      };
    });

    if (
      !goodsLines.length &&
      raw.colli &&
      raw.weightKg &&
      raw.lengthCm &&
      raw.widthCm &&
      raw.heightCm
    ) {
      const cbm = cbmFromDims(
        raw.lengthCm,
        raw.widthCm,
        raw.heightCm,
        raw.colli,
      );
      const ldm =
        raw.ldm ?? ldmFromDims(raw.lengthCm, raw.widthCm, raw.colli);
      goodsLines = [
        {
          quantity: raw.colli,
          weightKg: raw.weightKg,
          lengthCm: raw.lengthCm,
          widthCm: raw.widthCm,
          heightCm: raw.heightCm,
          ldm,
          cbm,
        },
      ];
    }

    if (!goodsLines.length) {
      throw new Error("Mindst én colli-linje er påkrævet");
    }

    const colli = goodsLines.reduce((s, g) => s + g.quantity, 0);
    const weightKg = goodsLines.reduce((s, g) => s + g.weightKg, 0);
    const ldm = goodsLines.reduce((s, g) => s + g.ldm, 0);
    const primary = goodsLines[0];

    return {
      originCountry: raw.originCountry,
      originZip: raw.originZip,
      originCity: raw.originCity,
      originAddress: raw.originAddress,
      destinationCountry: raw.destinationCountry,
      destinationZip: raw.destinationZip,
      destinationCity: raw.destinationCity,
      destinationAddress: raw.destinationAddress,
      goodsLines,
      weightKg,
      colli,
      ldm,
      lengthCm: primary.lengthCm,
      widthCm: primary.widthCm,
      heightCm: primary.heightCm,
      pickupDate: raw.pickupDate,
    };
  });

export type ShipmentFormValues = z.input<typeof shipmentSchema>;
export type ShipmentParsed = z.output<typeof shipmentSchema>;

export function toShipmentInput(values: ShipmentParsed): ShipmentInput {
  return values;
}
