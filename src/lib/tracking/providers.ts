import {
  carrierLabel,
  detectCarrier,
  publicTrackingUrl,
  type TrackingCarrier,
  type TrackingEvent,
  type TrackingResult,
} from "@/lib/tracking/types";

async function trackDhl(trackingNumber: string): Promise<TrackingResult | null> {
  const apiKey = process.env.DHL_TRACKING_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api-eu.dhl.com/track/shipments");
  url.searchParams.set("trackingNumber", trackingNumber);

  const res = await fetch(url, {
    headers: {
      "DHL-API-Key": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    shipments?: Array<{
      status?: { status?: string; description?: string };
      estimatedTimeOfDelivery?: string;
      events?: Array<{
        timestamp?: string;
        description?: string;
        location?: { address?: { addressLocality?: string } };
      }>;
    }>;
  };

  const shipment = data.shipments?.[0];
  if (!shipment) return null;

  const events: TrackingEvent[] = (shipment.events ?? []).map((e) => ({
    timestamp: e.timestamp ?? null,
    description: e.description ?? "",
    location: e.location?.address?.addressLocality ?? null,
  }));

  return {
    trackingNumber,
    carrier: "dhl",
    carrierLabel: carrierLabel("dhl"),
    status: shipment.status?.description ?? shipment.status?.status ?? null,
    estimatedDelivery: shipment.estimatedTimeOfDelivery ?? null,
    events,
    publicUrl: publicTrackingUrl("dhl", trackingNumber),
    source: "api",
  };
}

async function trackUps(trackingNumber: string): Promise<TrackingResult | null> {
  const clientId = process.env.UPS_CLIENT_ID;
  const clientSecret = process.env.UPS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenRes = await fetch("https://onlinetools.ups.com/security/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) return null;
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return null;

  const trackRes = await fetch(
    `https://onlinetools.ups.com/api/track/v1/details/${encodeURIComponent(trackingNumber)}`,
    {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        transId: crypto.randomUUID(),
        transactionSrc: "nor-courier-portal",
      },
    },
  );

  if (!trackRes.ok) return null;

  const data = (await trackRes.json()) as {
    trackResponse?: {
      shipment?: Array<{
        package?: Array<{
          currentStatus?: { description?: string };
          deliveryDate?: Array<{ date?: string }>;
          activity?: Array<{
            date?: string;
            time?: string;
            location?: { address?: { city?: string; country?: string } };
            status?: { description?: string };
          }>;
        }>;
      }>;
    };
  };

  const pkg = data.trackResponse?.shipment?.[0]?.package?.[0];
  if (!pkg) return null;

  const events: TrackingEvent[] = (pkg.activity ?? []).map((a) => ({
    timestamp:
      a.date && a.time
        ? `${a.date.slice(0, 4)}-${a.date.slice(4, 6)}-${a.date.slice(6, 8)}T${a.time.slice(0, 2)}:${a.time.slice(2, 4)}:${a.time.slice(4, 6)}`
        : a.date ?? null,
    description: a.status?.description ?? "",
    location: [a.location?.address?.city, a.location?.address?.country]
      .filter(Boolean)
      .join(", ") || null,
  }));

  return {
    trackingNumber,
    carrier: "ups",
    carrierLabel: carrierLabel("ups"),
    status: pkg.currentStatus?.description ?? null,
    estimatedDelivery: pkg.deliveryDate?.[0]?.date ?? null,
    events,
    publicUrl: publicTrackingUrl("ups", trackingNumber),
    source: "api",
  };
}

function deeplinkResult(
  trackingNumber: string,
  carrier: TrackingCarrier,
  message?: string,
): TrackingResult {
  return {
    trackingNumber,
    carrier,
    carrierLabel: carrierLabel(carrier),
    status: null,
    estimatedDelivery: null,
    events: [],
    publicUrl: publicTrackingUrl(carrier, trackingNumber),
    source: "deeplink",
    message,
  };
}

export async function trackShipment(options: {
  trackingNumber: string;
  carrier?: TrackingCarrier | "auto";
}): Promise<TrackingResult> {
  const trackingNumber = options.trackingNumber.trim().replace(/\s+/g, "");
  const carrier =
    !options.carrier || options.carrier === "auto"
      ? detectCarrier(trackingNumber)
      : options.carrier;

  if (carrier === "dhl") {
    const live = await trackDhl(trackingNumber);
    if (live) return live;
  }

  if (carrier === "ups") {
    const live = await trackUps(trackingNumber);
    if (live) return live;
  }

  // Try both live APIs when unknown
  if (carrier === "unknown") {
    const dhl = await trackDhl(trackingNumber);
    if (dhl) return dhl;
    const ups = await trackUps(trackingNumber);
    if (ups) return ups;
  }

  const hasAnyKey = Boolean(
    process.env.DHL_TRACKING_API_KEY ||
      (process.env.UPS_CLIENT_ID && process.env.UPS_CLIENT_SECRET),
  );

  return deeplinkResult(
    trackingNumber,
    carrier,
    hasAnyKey
      ? undefined
      : "Live carrier API keys are not configured; opening public carrier tracking.",
  );
}
