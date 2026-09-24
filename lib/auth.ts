import crypto from "node:crypto";

/* ------------------------------------------------------------------
 * JWT (HS256) + password hashing built on Node crypto — no deps.
 * ------------------------------------------------------------------ */

function b64url(data: string | Buffer): string {
  return Buffer.from(data).toString("base64url").replace(/=+$/, "");
}

export function hmacSign(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url")
    .replace(/=+$/, "");
}

export interface JwtPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">, secret: string, ttlSeconds = 60 * 60 * 12): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  };
  const claims = b64url(JSON.stringify(body));
  const signature = hmacSign(`${header}.${claims}`, secret);
  return `${header}.${claims}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, claims, signature] = parts;
  const expected = hmacSign(`${header}.${claims}`, secret);
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const payload = JSON.parse(Buffer.from(claims, "base64url").toString("utf-8")) as JwtPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------- passwords ------------------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$v1$N16384$r8$p1${salt}${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 7 || parts[0] !== "scrypt") return false;
    // Historical records stored salt/hash with a leading "N" — tolerate it.
    const salt = parts[5].startsWith("N") ? parts[5].slice(1) : parts[5];
    const expected = parts[6].startsWith("N") ? parts[6].slice(1) : parts[6];
    const actual = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}