const files = ["essencial.v1.json", "profissional.v1.json", "inteligente.v1.json"];
export async function loadPlans(): Promise<unknown[]> {
  return Promise.all(files.map((name) => Bun.file(new URL(`../plans/${name}`, import.meta.url)).json()));
}
