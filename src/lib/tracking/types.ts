export type TrackingCarrier = "dhl" | "ups" | "fedex" | "gls" | "unknown";

export type TrackingEvent = {
  timestamp: string | null;
  description: string;
  location: string | null;
};

export type TrackingResult = {
  trackingNumber: string;
  carrier: TrackingCarrier;
  carrierLabel: string;
  status: string | null;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
  publicUrl: string;
  source: "api" | "deeplink";
  message?: string;
};

const CARRIER_LABELS: Record<TrackingCarrier, string> = {
  dhl: "DHL",
  ups: "UPS",
  fedex: "FedEx",
  gls: "GLS",
  unknown: "Carrier",
};

export function detectCarrier(trackingNumber: string): TrackingCarrier {
  const n = trackingNumber.trim().toUpperCase().replace(/\s+/g, "");
  if (/^1Z[0-9A-Z]{16}$/.test(n)) return "ups";
  if (/^(JD|JJD|JVGL)/.test(n) || /^\d{10,11}$/.test(n) || /^[0-9]{20,39}$/.test(n)) {
    // DHL Express often 10 digits; DHL eCommerce longer numeric / JD*
    if (/^(JD|JJD|JVGL)/.test(n) || /^\d{10,11}$/.test(n)) return "dhl";
  }
  if (/^\d{12}$/.test(n) || /^\d{15}$/.test(n) || /^[0-9]{20}$/.test(n)) return "fedex";
  if (/^[0-9]{8,14}$/.test(n) && n.startsWith("00")) return "gls";
  if (/^1Z/i.test(n)) return "ups";
  return "unknown";
}

export function publicTrackingUrl(
  carrier: TrackingCarrier,
  trackingNumber: string,
): string {
  const n = encodeURIComponent(trackingNumber.trim());
  switch (carrier) {
    case "ups":
      return `https://www.ups.com/track?tracknum=${n}`;
    case "dhl":
      return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
    case "gls":
      return `https://gls-group.com/EU/en/parcel-tracking?match=${n}`;
    default:
      return `https://www.google.com/search?q=${n}+tracking`;
  }
}

export function carrierLabel(carrier: TrackingCarrier) {
  return CARRIER_LABELS[carrier];
}
