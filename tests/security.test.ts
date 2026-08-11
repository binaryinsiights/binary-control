import { describe, expect, test } from "bun:test";
import { timingSafeTextEqual, verifyHmac } from "../src/security";
import { isUuid, safeUrl, textField } from "../src/validation";

describe("segurança", () => {
  test("compara tokens sem aceitar tamanhos diferentes", () => {
    expect(timingSafeTextEqual("segredo", "segredo")).toBe(true);
    expect(timingSafeTextEqual("segredo", "outro")).toBe(false);
  });
  test("valida assinatura HMAC", async () => {
    const raw = '{"eventId":"evt-1"}';
    const secret = "um-segredo-longo-para-homologacao";
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw))).toString("hex");
    expect(await verifyHmac(raw, `sha256=${signature}`, secret)).toBe(true);
    expect(await verifyHmac(raw + "x", `sha256=${signature}`, secret)).toBe(false);
  });
});

describe("validação", () => {
  test("valida UUID, texto e somente URL HTTPS", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(textField("Clínica Moreira")).toBe(true);
    expect(safeUrl("https://agents.exemplo.com.br")).toBe(true);
    expect(safeUrl("http://agents.exemplo.com.br")).toBe(false);
  });
});
