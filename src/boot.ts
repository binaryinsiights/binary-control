import { migrate } from "./migrate";
await migrate();
const { seedAdmin } = await import("./auth");
await seedAdmin(process.env.DEFAULT_TENANT_ID ?? "");
await import("./server");
