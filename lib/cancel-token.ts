// HMAC-signed token used in self-cancel email links. Edge-compatible.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

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
  const secret = process.env.ADMIN_SESSION_TOKEN || "";
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export type CancelPayload = { gid: string; email: string; exp: number };

export async function signCancelToken(gid: string, email: string): Promise<string | null> {
  const key = await getKey();
  if (!key) return null;
  const payload: CancelPayload = {
    gid,
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const data = encoder.encode(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return `${b64uEnc(data)}.${b64uEnc(sig)}`;
}

export async function verifyCancelToken(token: string): Promise<CancelPayload | null> {
  if (!token) return null;
  const [dataB64, sigB64] = token.split(".");
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
    const payload = JSON.parse(decoder.decode(data)) as CancelPayload;
    if (typeof payload.gid !== "string" || typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
