import type { PortalBookingShipment, PortalPaymentStatus } from "@/types/domain";

export function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRoute(shipment: PortalBookingShipment | null | undefined) {
  if (!shipment) return "—";
  const from = [shipment.originZip, shipment.originCity]
    .filter(Boolean)
    .join(" ");
  const to = [shipment.destinationZip, shipment.destinationCity]
    .filter(Boolean)
    .join(" ");
  if (!from && !to) return "—";
  return `${from || "—"} → ${to || "—"}`;
}

export function paymentStatusLabel(status: PortalPaymentStatus) {
  switch (status) {
    case "awaiting_payment":
      return "Afventer betaling";
    case "credit_ok":
      return "Kredit OK";
    case "paid":
      return "Betalt";
    case "cancelled":
      return "Annulleret";
    default:
      return status;
  }
}

export function bookingRef(row: {
  id: string;
  tms_booking_number: string | null;
}) {
  return row.tms_booking_number?.trim() || row.id.slice(0, 8).toUpperCase();
}
