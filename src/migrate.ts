import postgres from "postgres";

const migrationFiles = ["001_foundation.sql", "002_operations.sql", "003_crm_auth.sql"] as const;
export async function migrate(): Promise<void> {
  const migrationUrl = process.env.MIGRATION_DATABASE_URL;
  const runtimePassword = process.env.DATABASE_RUNTIME_PASSWORD;
  if (!migrationUrl || !runtimePassword || runtimePassword.length < 24) throw new Error("Configuração segura do banco incompleta");
  const admin = postgres(migrationUrl, { max: 1 });
  try {
    const [role] = await admin`select 1 from pg_roles where rolname='binary_control_runtime'`;
    if (!role) {
      const [{ statement }] = await admin`select format('create role binary_control_runtime login password %L', ${runtimePassword}::text) statement`;
      await admin.unsafe(statement);
    }
    await admin.unsafe("alter role binary_control_runtime nosuperuser nocreatedb nocreaterole noinherit nobypassrls");
    await admin`create table if not exists binary_control_schema_migrations(name text primary key,applied_at timestamptz not null default now())`;
    for (const name of migrationFiles) {
      const [applied] = await admin`select 1 from binary_control_schema_migrations where name=${name}`;
      if (applied) continue;
      const content = await Bun.file(new URL(`../migrations/${name}`, import.meta.url)).text();
      await admin.begin(async (tx) => { await tx.unsafe(content); await tx`insert into binary_control_schema_migrations(name) values(${name})`; });
    }
    await admin.unsafe("grant connect on database binary_control to binary_control_runtime");
    await admin.unsafe("grant usage on schema public to binary_control_runtime");
    await admin.unsafe("grant select,insert,update,delete on all tables in schema public to binary_control_runtime");
    await admin.unsafe("grant usage,select on all sequences in schema public to binary_control_runtime");
  } finally { await admin.end(); }
}
