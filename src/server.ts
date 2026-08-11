import { isHeartbeat, overallHealth } from "./domain";
import { sql, tenantQuery } from "./db";
import { timingSafeTextEqual, verifyHmac } from "./security";
import { loadPlans } from "./plans";
import { isUuid, textField } from "./validation";

const tenantId = process.env.DEFAULT_TENANT_ID ?? "";
const json = (value: unknown, status = 200) => Response.json(value, { status });
function authorized(request: Request): boolean {
  const expected = process.env.INTERNAL_API_TOKEN ?? "";
  const received = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return expected.length >= 24 && timingSafeTextEqual(received, expected);
}

async function routes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js" || url.pathname === "/app.css")) {
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    return new Response(Bun.file(new URL(`../public/${file}`, import.meta.url)));
  }
  if (url.pathname === "/api/health") return json({ status: "ok", database: !!sql, version: "0.2.0" });
  if (url.pathname === "/api/v1/heartbeats" && request.method === "POST") {
    const raw = await request.text();
    const secret = process.env.HEARTBEAT_SECRET ?? "";
    if (secret.length < 24 || !(await verifyHmac(raw, request.headers.get("x-binary-signature") ?? "", secret))) return json({ error: "invalid_signature" }, 401);
    const body: unknown = JSON.parse(raw);
    if (!isHeartbeat(body)) return json({ error: "invalid_heartbeat" }, 422);
    await tenantQuery(tenantId, async (tx) => {
      const health = overallHealth(body.services);
      await tx`insert into health_snapshots (tenant_id,event_id,instance_id,occurred_at,overall_status,services,versions)
        values (${tenantId},${body.eventId},${body.instanceId},${body.occurredAt},${health},${tx.json(body.services)},${tx.json(body.versions ?? {})})
        on conflict (tenant_id,event_id) do nothing`;
      const [deployment] = await tx`update managed_deployments set last_heartbeat_at=${body.occurredAt},health_status=${health},updated_at=now()
        where tenant_id=${tenantId} and instance_id=${body.instanceId} returning id`;
      if (deployment && health !== "healthy") {
        await tx`insert into managed_alerts(tenant_id,deployment_id,severity,code,title)
          select ${tenantId},${deployment.id},${health === "offline" ? "critical" : "warning"},'service_health','Serviços remotos requerem atenção'
          where not exists(select 1 from managed_alerts where deployment_id=${deployment.id} and code='service_health' and status='open')`;
      } else if (deployment) {
        await tx`update managed_alerts set status='resolved',resolved_at=now() where deployment_id=${deployment.id} and code='service_health' and status='open'`;
      }
    });
    return json({ accepted: true }, 202);
  }
  if (!authorized(request)) return json({ error: "unauthorized" }, 401);
  if (url.pathname === "/api/v1/plans" && request.method === "GET") return json({ data: await loadPlans() });
  if (url.pathname === "/api/v1/dashboard" && request.method === "GET") {
    const [row] = await tenantQuery(tenantId, (tx) => tx`select
      (select count(*)::int from managed_customers) customers,
      (select count(*)::int from managed_deployments) deployments,
      (select count(*)::int from managed_deployments where health_status='offline') offline,
      (select count(*)::int from managed_alerts where status='open') open_alerts`);
    return json({ data: { customers: row.customers, deployments: row.deployments, offline: row.offline, openAlerts: row.open_alerts } });
  }
  if (url.pathname === "/api/v1/customers" && request.method === "GET") {
    return json({ data: await tenantQuery(tenantId, (tx) => tx`select id,external_id,name,industry,status,created_at from managed_customers order by name`) });
  }
  if (url.pathname === "/api/v1/customers" && request.method === "POST") {
    const body = await request.json() as Record<string, string>;
    if (!textField(body.externalId,80) || !textField(body.name) || !textField(body.industry,100)) return json({ error: "invalid_customer" }, 422);
    const [row] = await tenantQuery(tenantId, async (tx) => {
      const [created] = await tx`insert into managed_customers (tenant_id,external_id,name,industry)
        values (${tenantId},${body.externalId},${body.name},${body.industry}) returning id,external_id,name,industry,status,created_at`;
      await tx`insert into audit_events(tenant_id,actor_id,action,entity_type,entity_id) values(${tenantId},'internal-api','customer.created','managed_customer',${created.id})`;
      return [created];
    });
    return json({ data: row }, 201);
  }
  if (url.pathname === "/api/v1/deployments" && request.method === "GET") {
    return json({ data: await tenantQuery(tenantId, (tx) => tx`select d.id,d.customer_id,c.name customer_name,d.deployment_id,d.instance_id,d.plan_code,d.plan_version,d.state,d.health_status,d.last_heartbeat_at from managed_deployments d join managed_customers c on c.id=d.customer_id order by d.created_at desc`) });
  }
  if (url.pathname === "/api/v1/deployments" && request.method === "POST") {
    const body = await request.json() as Record<string,string>;
    if (!isUuid(body.customerId)||!isUuid(body.deploymentId)||!textField(body.instanceId,120)||!["ESSENCIAL","PROFISSIONAL","INTELIGENTE"].includes(body.planCode)||!/^\d+\.\d+\.\d+$/.test(body.planVersion??"")) return json({error:"invalid_deployment"},422);
    const [row]=await tenantQuery(tenantId,async(tx)=>{
      const [created]=await tx`insert into managed_deployments(tenant_id,customer_id,deployment_id,instance_id,plan_code,plan_version) values(${tenantId},${body.customerId},${body.deploymentId},${body.instanceId},${body.planCode},${body.planVersion}) returning *`;
      await tx`insert into audit_events(tenant_id,actor_id,action,entity_type,entity_id) values(${tenantId},'internal-api','deployment.created','managed_deployment',${created.id})`;
      return [created];
    }); return json({data:row},201);
  }
  if (url.pathname === "/api/v1/agents" && request.method === "GET") {
    return json({data:await tenantQuery(tenantId,(tx)=>tx`select a.*,d.instance_id from remote_agents a join managed_deployments d on d.id=a.deployment_id order by a.name`)});
  }
  if (url.pathname === "/api/v1/agents" && request.method === "POST") {
    const body=await request.json() as Record<string,string|number>;
    if(!isUuid(body.deploymentId)||!textField(body.remoteId,120)||!textField(body.name)||!textField(body.roleName))return json({error:"invalid_agent"},422);
    const [row]=await tenantQuery(tenantId,async(tx)=>{
      const [created]=await tx`insert into remote_agents(tenant_id,deployment_id,remote_id,name,role_name,mode,status,channel_count) values(${tenantId},${body.deploymentId},${body.remoteId},${body.name},${body.roleName},${body.mode??'attendance'},${body.status??'inactive'},${Number(body.channelCount??0)}) returning *`;
      await tx`insert into audit_events(tenant_id,actor_id,action,entity_type,entity_id) values(${tenantId},'internal-api','agent.created','remote_agent',${created.id})`;
      return [created];
    });
    return json({data:row},201);
  }
  if (url.pathname === "/api/v1/alerts" && request.method === "GET") {
    return json({data:await tenantQuery(tenantId,(tx)=>tx`select id,deployment_id,severity,code,title,status,opened_at,resolved_at from managed_alerts order by opened_at desc limit 200`)});
  }
  return json({ error: "not_found" }, 404);
}

Bun.serve({ port: Number(process.env.PORT ?? 3000), fetch: (request) => routes(request).catch((error) => {
  console.error(JSON.stringify({ level: "error", message: error instanceof Error ? error.message : "unknown" }));
  return json({ error: "internal_error" }, 500);
}) });
