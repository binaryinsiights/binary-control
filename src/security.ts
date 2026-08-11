import { timingSafeEqual } from "node:crypto";

export function timingSafeTextEqual(received: string, expected: string): boolean {
  const left = new TextEncoder().encode(received);
  const right = new TextEncoder().encode(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function verifyHmac(raw: string, signature: string, secret: string): Promise<boolean> {
  if (!/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, Uint8Array.fromHex(signature.slice(7)), new TextEncoder().encode(raw));
}
