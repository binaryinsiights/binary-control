import Ajv2020 from "ajv/dist/2020";
import schema from "../plans/plan.schema.json";

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);
for (const path of ["essencial.v1.json", "profissional.v1.json", "enterprise.v1.json"]) {
  const value = await Bun.file(new URL(`../plans/${path}`, import.meta.url)).json();
  if (!validate(value)) throw new Error(`${path}: ${ajv.errorsText(validate.errors)}`);
  console.log(`válido: ${path}`);
}
