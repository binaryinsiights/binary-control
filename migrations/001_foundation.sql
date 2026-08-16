create extension if not exists pgcrypto;
create table managed_customers (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, external_id text not null, name text not null,
 industry text not null, status text not null default 'ACTIVE', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique (tenant_id,external_id)
);
create table managed_deployments (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, customer_id uuid not null references managed_customers(id),
 deployment_id uuid not null, instance_id text not null, plan_code text not null check(plan_code in ('ESSENCIAL','PROFISSIONAL','ENTERPRISE')),
 plan_version text not null, state text not null default 'DRAFT', health_status text not null default 'offline',
 last_heartbeat_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,deployment_id), unique(tenant_id,instance_id)
);
create table health_snapshots (
 id bigserial primary key, tenant_id uuid not null, event_id text not null, instance_id text not null, occurred_at timestamptz not null,
 overall_status text not null, services jsonb not null, versions jsonb not null default '{}', received_at timestamptz not null default now(),
 unique(tenant_id,event_id)
);
create table audit_events (
 id bigserial primary key, tenant_id uuid not null, actor_id text not null, action text not null, entity_type text not null,
 entity_id text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
alter table managed_customers enable row level security;
alter table managed_deployments enable row level security;
alter table health_snapshots enable row level security;
alter table audit_events enable row level security;
alter table managed_customers force row level security;
alter table managed_deployments force row level security;
alter table health_snapshots force row level security;
alter table audit_events force row level security;
do $$ declare t text; begin foreach t in array array['managed_customers','managed_deployments','health_snapshots','audit_events'] loop
 execute format('create policy tenant_isolation on %I using (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid) with check (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid)',t);
end loop; end $$;
