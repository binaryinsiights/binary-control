#!/bin/sh
set -eu
test -n "${BINARY_CONTROL_DB_PASSWORD:-}"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=runtime_password="$BINARY_CONTROL_DB_PASSWORD" <<'SQL'
select 'create role binary_control_runtime login password ' || quote_literal(:'runtime_password')
where not exists (select 1 from pg_roles where rolname='binary_control_runtime')\gexec
alter role binary_control_runtime nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
SQL
