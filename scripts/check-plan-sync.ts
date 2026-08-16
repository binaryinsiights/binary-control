import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dir, "..");
const agentsRoot = process.env.BINARY_AGENTS_ROOT ?? path.resolve(root, "../binary-thalya-agents");
const files = (await readdir(path.join(root, "plans"))).filter((file) => file.endsWith(".v1.json")).sort();
const canonical = await Promise.all(files.map(async (file) => JSON.parse(await Bun.file(path.join(root, "plans", file)).text())));
const imported = await import(pathToFileURL(path.join(agentsRoot, "src/modules/crm/plans.ts")).href);
const embedded = imported.CRM_PLAN_DEFINITIONS as unknown[];
const comparable = (value: unknown): unknown => {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(comparable);
  const result: Record<string, unknown> = {};
  for (const key of ["schemaVersion", "planCode", "version", "displayName", "limits", "features"]) {
    if (key in (value as Record<string, unknown>)) result[key] = comparable((value as Record<string, unknown>)[key]);
  }
  return result;
};
const sortPlans = (value: unknown[]) => value.map(comparable).sort((a, b) => String((a as Record<string, unknown>).planCode).localeCompare(String((b as Record<string, unknown>).planCode)));
if (JSON.stringify(sortPlans(canonical)) !== JSON.stringify(sortPlans(embedded))) {
  console.error("planos divergentes entre binary-control/plans e Agents/src/modules/crm/plans.ts");
  process.exit(1);
}
console.log(`planos sincronizados: ${canonical.length}`);
