import type { PortalBookingRequest, PortalPaymentStatus } from "@/types/domain";

export function formatDkk(amount: number) {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatBookingDate(iso: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
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

export function routeFromShipment(order: PortalBookingRequest) {
  const s = order.shipment ?? {};
  const from = [s.originZip, s.originCity].filter(Boolean).join(" ");
  const to = [s.destinationZip, s.destinationCity].filter(Boolean).join(" ");
  if (!from && !to) return "—";
  return `${from || "?"} → ${to || "?"}`;
}

export function bookingRef(order: PortalBookingRequest) {
  return order.tms_booking_number || order.id.slice(0, 8).toUpperCase();
}

/** Simple KPI mapping until TMS shipment status is wired */
export function classifyOrder(order: PortalBookingRequest) {
  if (order.payment_status === "cancelled") return "closed" as const;
  if (order.payment_status === "paid" || order.payment_status === "credit_ok") {
    return "active" as const;
  }
  return "upcoming" as const;
}
