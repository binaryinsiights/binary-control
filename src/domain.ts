export type ServiceState = "healthy" | "degraded" | "offline";
export type Heartbeat = {
  eventId: string;
  instanceId: string;
  occurredAt: string;
  services: Record<"agents" | "chatwoot" | "baileys" | "langfuse", ServiceState>;
  versions?: Record<string, string>;
};

export function isHeartbeat(value: unknown): value is Heartbeat {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  const services = body.services as Record<string, unknown> | undefined;
  return typeof body.eventId === "string" && typeof body.instanceId === "string" &&
    typeof body.occurredAt === "string" && !Number.isNaN(Date.parse(body.occurredAt)) &&
    !!services && ["agents", "chatwoot", "baileys", "langfuse"].every((key) =>
      ["healthy", "degraded", "offline"].includes(String(services[key]))
    );
}

export function overallHealth(services: Heartbeat["services"]): ServiceState {
  const values = Object.values(services);
  if (values.includes("offline")) return "offline";
  if (values.includes("degraded")) return "degraded";
  return "healthy";
}
