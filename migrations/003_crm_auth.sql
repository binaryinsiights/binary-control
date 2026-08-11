alter table managed_customers add column legal_name text;
alter table managed_customers add column contact_name text;
alter table managed_customers add column contact_email text;
alter table managed_customers add column contact_phone text;
alter table managed_customers add column commercial_status text not null default 'lead';
alter table managed_customers add column financial_status text not null default 'pending';
alter table managed_customers add column support_status text not null default 'onboarding';

create table internal_users (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, email text not null, name text not null,
 password_hash text not null, role text not null check(role in ('SUPER_ADMIN','GESTOR','IMPLANTADOR','SUPORTE','COMERCIAL','FINANCEIRO')),
 active boolean not null default true, created_at timestamptz not null default now(), unique(tenant_id,email)
);
create table internal_sessions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, user_id uuid not null references internal_users(id) on delete cascade,
 token_hash text not null unique, expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table managed_contracts (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, customer_id uuid not null references managed_customers(id),
 plan_code text not null, plan_version text not null, status text not null default 'draft',
 starts_at date, ends_at date, monthly_value_cents integer, setup_value_cents integer, created_at timestamptz not null default now()
);
create table deployment_approvals (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, deployment_id uuid not null references managed_deployments(id),
 approval_type text not null check(approval_type in ('infrastructure','agent_content','homologation','production')),
 status text not null default 'pending', approved_by uuid references internal_users(id), approved_at timestamptz, notes text,
 unique(tenant_id,deployment_id,approval_type)
);
create table usage_snapshots (
 id bigserial primary key, tenant_id uuid not null, deployment_id uuid not null references managed_deployments(id),
 period_start date not null, conversations integer not null default 0, input_tokens bigint not null default 0,
 output_tokens bigint not null default 0, audio_minutes numeric not null default 0, tool_calls integer not null default 0,
 human_transfers integer not null default 0, estimated_cost_cents integer not null default 0, captured_at timestamptz not null default now(),
 unique(tenant_id,deployment_id,period_start)
);
do $$ declare t text; begin foreach t in array array['internal_users','internal_sessions','managed_contracts','deployment_approvals','usage_snapshots'] loop
 execute format('alter table %I enable row level security',t);
 execute format('alter table %I force row level security',t);
 execute format('create policy tenant_isolation on %I using (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid) with check (tenant_id=nullif(current_setting(''app.tenant_id'',true),'''')::uuid)',t);
end loop; end $$;
create index internal_sessions_expiry_idx on internal_sessions(tenant_id,expires_at);
create index managed_customers_pipeline_idx on managed_customers(tenant_id,commercial_status);
