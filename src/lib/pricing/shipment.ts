import { z } from "zod";
import type { ShipmentInput } from "@/types/domain";

/** Goods + addresses aligned with TMS booking/check-price inputs */
export const shipmentSchema = z.object({
  originCountry: z.string().min(2).max(2).transform((v) => v.toUpperCase()),
  originZip: z.string().trim().min(2).max(16),
  originCity: z.string().trim().min(1).max(80),
  destinationCountry: z
    .string()
    .min(2)
    .max(2)
    .transform((v) => v.toUpperCase()),
  destinationZip: z.string().trim().min(2).max(16),
  destinationCity: z.string().trim().min(1).max(80),
  weightKg: z.coerce.number().positive().max(40000),
  colli: z.coerce.number().int().positive().max(200),
  ldm: z.coerce.number().positive().max(40),
  lengthCm: z.coerce.number().positive().max(1200),
  widthCm: z.coerce.number().positive().max(1200),
  heightCm: z.coerce.number().positive().max(1200),
  pickupDate: z.string().optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export function toShipmentInput(values: ShipmentFormValues): ShipmentInput {
  return values;
}
