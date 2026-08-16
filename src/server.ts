import { isHeartbeat, overallHealth } from "./domain";
import { sql, tenantQuery } from "./db";
import { timingSafeTextEqual, verifyHmac } from "./security";
import { loadPlans } from "./plans";
import { isUuid, textField } from "./validation";
import { authenticate, login, type Actor } from "./auth";

const tenantId = process.env.DEFAULT_TENANT_ID ?? "";
const json = (value: unknown, status = 200) => Response.json(value, { status });
async function currentActor(request: Request): Promise<Actor | null> {
  const expected = process.env.INTERNAL_API_TOKEN ?? "";
  const received = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (expected.length >= 24 && timingSafeTextEqual(received, expected)) return { id: "internal-api", email: "system@binary.local", name: "API interna", role: "SUPER_ADMIN" };
  return authenticate(tenantId, received);
}

async function routes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js" || url.pathname === "/app.css")) {
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    return new Response(Bun.file(new URL(`../public/${file}`, import.meta.url)));
  }
  if (url.pathname === "/api/health") return json({ status: "ok", database: !!sql, version: "0.3.0" });
  if (url.pathname === "/api/v1/auth/login" && request.method === "POST") {
    const body = await request.json() as Record<string,string>;
    if (!textField(body.email) || !textField(body.password)) return json({ error: "invalid_credentials" }, 401);
    const session = await login(tenantId, body.email, body.password);
    return session ? json({ data: session }) : json({ error: "invalid_credentials" }, 401);
  }
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
  const actor = await currentActor(request);
  if (!actor) return json({ error: "unauthorized" }, 401);
  if (url.pathname === "/api/v1/auth/me" && request.method === "GET") return json({ data: actor });
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
    return json({ data: await tenantQuery(tenantId, (tx) => tx`select id,external_id,name,legal_name,industry,status,contact_name,contact_email,contact_phone,commercial_status,financial_status,support_status,created_at from managed_customers order by name`) });
  }
  if (url.pathname === "/api/v1/customers" && request.method === "POST") {
    const body = await request.json() as Record<string, string>;
    if (!textField(body.externalId,80) || !textField(body.name) || !textField(body.industry,100)) return json({ error: "invalid_customer" }, 422);
    const [row] = await tenantQuery(tenantId, async (tx) => {
      const [created] = await tx`insert into managed_customers (tenant_id,external_id,name,legal_name,industry,contact_name,contact_email,contact_phone)
        values (${tenantId},${body.externalId},${body.name},${body.legalName??null},${body.industry},${body.contactName??null},${body.contactEmail??null},${body.contactPhone??null}) returning *`;
      await tx`insert into audit_events(tenant_id,actor_id,action,entity_type,entity_id) values(${tenantId},${actor.id},'customer.created','managed_customer',${created.id})`;
      return [created];
    });
    return json({ data: row }, 201);
  }
  if (url.pathname === "/api/v1/deployments" && request.method === "GET") {
    return json({ data: await tenantQuery(tenantId, (tx) => tx`select d.id,d.customer_id,c.name customer_name,d.deployment_id,d.instance_id,d.plan_code,d.plan_version,d.state,d.health_status,d.last_heartbeat_at from managed_deployments d join managed_customers c on c.id=d.customer_id order by d.created_at desc`) });
  }
  if (url.pathname === "/api/v1/deployments" && request.method === "POST") {
    const body = await request.json() as Record<string,string>;
    if (!isUuid(body.customerId)||!isUuid(body.deploymentId)||!textField(body.instanceId,120)||!["ESSENCIAL","PROFISSIONAL","ENTERPRISE"].includes(body.planCode)||!/^\d+\.\d+\.\d+$/.test(body.planVersion??"")) return json({error:"invalid_deployment"},422);
    const [row]=await tenantQuery(tenantId,async(tx)=>{
      const [created]=await tx`insert into managed_deployments(tenant_id,customer_id,deployment_id,instance_id,plan_code,plan_version) values(${tenantId},${body.customerId},${body.deploymentId},${body.instanceId},${body.planCode},${body.planVersion}) returning *`;
      await tx`insert into audit_events(tenant_id,actor_id,action,entity_type,entity_id) values(${tenantId},${actor.id},'deployment.created','managed_deployment',${created.id})`;
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
      await tx`insert into audit_events(tenant_id,actor_id,action,entity_type,entity_id) values(${tenantId},${actor.id},'agent.created','remote_agent',${created.id})`;
      return [created];
    });
    return json({data:row},201);
  }
  if (url.pathname === "/api/v1/alerts" && request.method === "GET") {
    return json({data:await tenantQuery(tenantId,(tx)=>tx`select id,deployment_id,severity,code,title,status,opened_at,resolved_at from managed_alerts order by opened_at desc limit 200`)});
  }
  if (url.pathname === "/api/v1/contracts" && request.method === "GET") {
    return json({data:await tenantQuery(tenantId,(tx)=>tx`select c.*,m.name customer_name from managed_contracts c join managed_customers m on m.id=c.customer_id order by c.created_at desc`)});
  }
  if (url.pathname === "/api/v1/contracts" && request.method === "POST") {
    const body=await request.json() as Record<string,string|number>;
    if(!isUuid(body.customerId)||!["ESSENCIAL","PROFISSIONAL","ENTERPRISE"].includes(String(body.planCode))||!/^\d+\.\d+\.\d+$/.test(String(body.planVersion)))return json({error:"invalid_contract"},422);
    const [row]=await tenantQuery(tenantId,(tx)=>tx`insert into managed_contracts(tenant_id,customer_id,plan_code,plan_version,status,starts_at,monthly_value_cents,setup_value_cents)
      values(${tenantId},${body.customerId},${body.planCode},${body.planVersion},${body.status??'draft'},${body.startsAt??null},${Number(body.monthlyValueCents??0)},${Number(body.setupValueCents??0)}) returning *`);
    return json({data:row},201);
  }
  if (url.pathname === "/api/v1/checklist" && request.method === "GET") {
    const deploymentId=url.searchParams.get("deploymentId"); if(!isUuid(deploymentId))return json({error:"invalid_deployment"},422);
    return json({data:await tenantQuery(tenantId,(tx)=>tx`select * from deployment_checklist_items where deployment_id=${deploymentId} order by phase,item_key`)});
  }
  if (url.pathname === "/api/v1/checklist" && request.method === "POST") {
    const body=await request.json() as Record<string,string>;
    if(!isUuid(body.deploymentId)||!textField(body.phase,80)||!textField(body.itemKey,100)||!textField(body.label))return json({error:"invalid_checklist"},422);
    const [row]=await tenantQuery(tenantId,(tx)=>tx`insert into deployment_checklist_items(tenant_id,deployment_id,phase,item_key,label,status,responsible,evidence_url)
      values(${tenantId},${body.deploymentId},${body.phase},${body.itemKey},${body.label},${body.status??'pending'},${body.responsible??null},${body.evidenceUrl??null})
      on conflict(tenant_id,deployment_id,item_key) do update set status=excluded.status,responsible=excluded.responsible,evidence_url=excluded.evidence_url,completed_at=case when excluded.status='completed' then now() else null end,updated_at=now() returning *`);
    return json({data:row},201);
  }
  if (url.pathname === "/api/v1/approvals" && request.method === "POST") {
    const body=await request.json() as Record<string,string>;
    if(!isUuid(body.deploymentId)||!["infrastructure","agent_content","homologation","production"].includes(body.approvalType))return json({error:"invalid_approval"},422);
    const [row]=await tenantQuery(tenantId,(tx)=>tx`insert into deployment_approvals(tenant_id,deployment_id,approval_type,status,approved_by,approved_at,notes)
      values(${tenantId},${body.deploymentId},${body.approvalType},${body.status??'approved'},${actor.id==='internal-api'?null:actor.id},case when ${body.status??'approved'}='approved' then now() else null end,${body.notes??null})
      on conflict(tenant_id,deployment_id,approval_type) do update set status=excluded.status,approved_by=excluded.approved_by,approved_at=excluded.approved_at,notes=excluded.notes returning *`);
    return json({data:row},201);
  }
  if (url.pathname === "/api/v1/audit" && request.method === "GET") {
    return json({data:await tenantQuery(tenantId,(tx)=>tx`select actor_id,action,entity_type,entity_id,metadata,created_at from audit_events order by created_at desc limit 200`)});
  }
  return json({ error: "not_found" }, 404);
}

Bun.serve({ port: Number(process.env.PORT ?? 3000), fetch: (request) => routes(request).catch((error) => {
  console.error(JSON.stringify({ level: "error", message: error instanceof Error ? error.message : "unknown" }));
  return json({ error: "internal_error" }, 500);
}) });
