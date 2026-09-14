import { createHmac, timingSafeEqual } from "crypto";

export type TmsSsoPayload = {
  v: 1;
  exp: number;
  iat: number;
  nonce: string;
  tmsUserId: string;
  tmsEmail: string;
};

function b64urlEncode(value: string | Buffer) {
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64").toString("utf8");
}

export function getTmsSsoSecret() {
  return process.env.PORTAL_TMS_SSO_SECRET?.trim() || "";
}

export function getTmsSsoAdminEmail() {
  return (
    process.env.PORTAL_TMS_SSO_ADMIN_EMAIL?.trim().toLowerCase() ||
    "contact@norspedition.dk"
  );
}

export function verifyTmsSsoToken(token: string, secret: string): TmsSsoPayload {
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new Error("Ugyldigt SSO-token.");
  }

  const [body, sig] = parts;
  const expected = createHmac("sha256", secret).update(body).digest();
  const actual = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Ugyldig SSO-signatur.");
  }

  const payload = JSON.parse(b64urlDecode(body)) as TmsSsoPayload;
  if (payload.v !== 1 || typeof payload.exp !== "number") {
    throw new Error("Ugyldigt SSO-payload.");
  }
  if (payload.exp * 1000 < Date.now()) {
    throw new Error("SSO-token er udløbet.");
  }

  return payload;
}

/** Shared encoding helper for tests / docs (TMS signs with the same scheme). */
export function encodeTmsSsoBody(payload: TmsSsoPayload) {
  return b64urlEncode(JSON.stringify(payload));
}

export function signTmsSsoBody(body: string, secret: string) {
  return b64urlEncode(createHmac("sha256", secret).update(body).digest());
}
