import { randomBytes, createHash } from "node:crypto";
import { tenantQuery } from "./db";

export type Actor = { id: string; email: string; name: string; role: string };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function seedAdmin(tenantId: string): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD forte são obrigatórios");
  await tenantQuery(tenantId, async (tx) => {
    const [existing] = await tx`select id from internal_users where email=${email}`;
    if (existing) return;
    const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id" });
    await tx`insert into internal_users(tenant_id,email,name,password_hash,role) values(${tenantId},${email},'Administrador Binary Insights',${passwordHash},'SUPER_ADMIN')`;
  });
}

export async function login(tenantId: string, email: string, password: string): Promise<{ token: string; actor: Actor } | null> {
  return tenantQuery(tenantId, async (tx) => {
    const [user] = await tx`select id,email,name,role,password_hash from internal_users where email=${email.toLowerCase()} and active=true`;
    if (!user || !(await Bun.password.verify(password, user.password_hash))) return null;
    const token = randomBytes(32).toString("hex");
    await tx`insert into internal_sessions(tenant_id,user_id,token_hash,expires_at) values(${tenantId},${user.id},${hash(token)},now()+interval '12 hours')`;
    return { token, actor: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });
}

export async function authenticate(tenantId: string, token: string): Promise<Actor | null> {
  if (!token) return null;
  return tenantQuery(tenantId, async (tx) => {
    const [user] = await tx`select u.id,u.email,u.name,u.role from internal_sessions s join internal_users u on u.id=s.user_id
      where s.token_hash=${hash(token)} and s.expires_at>now() and u.active=true`;
    return user ? { id: user.id, email: user.email, name: user.name, role: user.role } : null;
  });
}
