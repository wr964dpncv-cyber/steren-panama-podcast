// Edge-compatible signed session cookie (HMAC-SHA256 over JSON payload).

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type SessionPayload = { uid: number; exp: number };

function getSecret(): string {
  return process.env.ADMIN_SESSION_TOKEN || "";
}

function b64uEnc(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64uDec(s: string): Uint8Array {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey | null> {
  const secret = getSecret();
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(uid: number): Promise<string | null> {
  const key = await getKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload: SessionPayload = { uid, exp };
  const data = encoder.encode(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return `${b64uEnc(data)}.${b64uEnc(sig)}`;
}

export async function verifySession(cookie: string | undefined | null): Promise<SessionPayload | null> {
  if (!cookie) return null;
  const [dataB64, sigB64] = cookie.split(".");
  if (!dataB64 || !sigB64) return null;
  const key = await getKey();
  if (!key) return null;
  let data: Uint8Array;
  let sig: Uint8Array;
  try {
    data = b64uDec(dataB64);
    sig = b64uDec(sigB64);
  } catch {
    return null;
  }
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", key, sig as BufferSource, data as BufferSource);
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const payload = JSON.parse(decoder.decode(data)) as SessionPayload;
    if (typeof payload.uid !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
