create table commercial_plans (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, code text not null,
 version text not null, display_name text not null, definition jsonb not null, published_at timestamptz not null default now(),
 unique(tenant_id,code,version)
);
create table remote_services (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, deployment_id uuid not null references managed_deployments(id),
 service_type text not null check(service_type in ('agents','chatwoot','baileys','langfuse')),
 base_url text, version text, status text not null default 'offline', checked_at timestamptz,
 unique(tenant_id,deployment_id,service_type)
);
create table remote_agents (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, deployment_id uuid not null references managed_deployments(id),
 remote_id text not null, name text not null, role_name text not null, mode text not null default 'attendance',
 status text not null default 'inactive', channel_count integer not null default 0,
 knowledge_status text not null default 'unknown', integration_count integer not null default 0,
 template_version text, updated_at timestamptz not null default now(),
 unique(tenant_id,deployment_id,remote_id)
);
create table deployment_checklist_items (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, deployment_id uuid not null references managed_deployments(id),
 phase text not null, item_key text not null, label text not null, status text not null default 'pending',
 responsible text, evidence_url text, completed_at timestamptz, updated_at timestamptz not null default now(),
 unique(tenant_id,deployment_id,item_key)
);
create table managed_alerts (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, deployment_id uuid references managed_deployments(id),
 severity text not null check(severity in ('info','warning','critical')), code text not null, title text not null,
 status text not null default 'open', opened_at timestamptz not null default now(), resolved_at timestamptz
);
create table maintenance_records (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, deployment_id uuid not null references managed_deployments(id),
 kind text not null, summary text not null, status text not null default 'planned', scheduled_at timestamptz,
 completed_at timestamptz, created_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['commercial_plans','remote_services','remote_agents','deployment_checklist_items','managed_alerts','maintenance_records'] loop
 execute format('alter table %I enable row level security',t);
 execute format('alter table %I force row level security',t);
 execute format('create policy tenant_isolation on %I using (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid) with check (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid)',t);
end loop; end $$;
create index health_snapshots_instance_time_idx on health_snapshots(tenant_id,instance_id,occurred_at desc);
create index managed_alerts_open_idx on managed_alerts(tenant_id,status,severity);
