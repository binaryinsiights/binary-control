import { describe, expect, test } from "bun:test";
import { isHeartbeat, overallHealth } from "../src/domain";
const services = { agents: "healthy", chatwoot: "healthy", baileys: "healthy", langfuse: "healthy" } as const;
describe("heartbeat", () => {
  test("valida o contrato", () => expect(isHeartbeat({ eventId: "e1", instanceId: "i1", occurredAt: new Date().toISOString(), services })).toBe(true));
  test("rejeita serviço ausente", () => expect(isHeartbeat({ eventId: "e1", instanceId: "i1", occurredAt: new Date().toISOString(), services: { agents: "healthy" } })).toBe(false));
  test("prioriza offline", () => expect(overallHealth({ ...services, baileys: "offline" })).toBe("offline"));
});
