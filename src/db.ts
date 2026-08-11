import postgres from "postgres";

export const sql = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 10 }) : null;

export async function tenantQuery<T>(tenantId: string, operation: (tx: postgres.Sql) => Promise<T>): Promise<T> {
  if (!sql) throw new Error("DATABASE_URL não configurada");
  return sql.begin(async (tx) => {
    await tx`select set_config('app.tenant_id', ${tenantId}, true)`;
    return operation(tx);
  }) as Promise<T>;
}
