import { isHeartbeat, overallHealth } from "./domain";
import { sql, tenantQuery } from "./db";
import { timingSafeTextEqual, verifyHmac } from "./security";

const tenantId = process.env.DEFAULT_TENANT_ID ?? "";
const json = (value: unknown, status = 200) => Response.json(value, { status });
function authorized(request: Request): boolean {
  const expected = process.env.INTERNAL_API_TOKEN ?? "";
  const received = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return expected.length >= 24 && timingSafeTextEqual(received, expected);
}

async function routes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === "/api/health") return json({ status: "ok", database: !!sql, version: "0.1.0" });
  if (url.pathname === "/api/v1/heartbeats" && request.method === "POST") {
    const raw = await request.text();
    const secret = process.env.HEARTBEAT_SECRET ?? "";
    if (secret.length < 24 || !(await verifyHmac(raw, request.headers.get("x-binary-signature") ?? "", secret))) return json({ error: "invalid_signature" }, 401);
    const body: unknown = JSON.parse(raw);
    if (!isHeartbeat(body)) return json({ error: "invalid_heartbeat" }, 422);
    await tenantQuery(tenantId, async (tx) => {
      await tx`insert into health_snapshots (tenant_id,event_id,instance_id,occurred_at,overall_status,services,versions)
        values (${tenantId},${body.eventId},${body.instanceId},${body.occurredAt},${overallHealth(body.services)},${tx.json(body.services)},${tx.json(body.versions ?? {})})
        on conflict (tenant_id,event_id) do nothing`;
      await tx`update managed_deployments set last_heartbeat_at=${body.occurredAt},health_status=${overallHealth(body.services)},updated_at=now()
        where tenant_id=${tenantId} and instance_id=${body.instanceId}`;
    });
    return json({ accepted: true }, 202);
  }
  if (!authorized(request)) return json({ error: "unauthorized" }, 401);
  if (url.pathname === "/api/v1/customers" && request.method === "GET") {
    return json({ data: await tenantQuery(tenantId, (tx) => tx`select id,external_id,name,industry,status,created_at from managed_customers order by name`) });
  }
  if (url.pathname === "/api/v1/customers" && request.method === "POST") {
    const body = await request.json() as Record<string, string>;
    if (!body.externalId || !body.name || !body.industry) return json({ error: "invalid_customer" }, 422);
    const [row] = await tenantQuery(tenantId, (tx) => tx`insert into managed_customers (tenant_id,external_id,name,industry)
      values (${tenantId},${body.externalId},${body.name},${body.industry}) returning id,external_id,name,industry,status,created_at`);
    return json({ data: row }, 201);
  }
  if (url.pathname === "/api/v1/deployments" && request.method === "GET") {
    return json({ data: await tenantQuery(tenantId, (tx) => tx`select id,customer_id,deployment_id,instance_id,plan_code,plan_version,state,health_status,last_heartbeat_at from managed_deployments order by created_at desc`) });
  }
  return json({ error: "not_found" }, 404);
}

Bun.serve({ port: Number(process.env.PORT ?? 3000), fetch: (request) => routes(request).catch((error) => {
  console.error(JSON.stringify({ level: "error", message: error instanceof Error ? error.message : "unknown" }));
  return json({ error: "internal_error" }, 500);
}) });
