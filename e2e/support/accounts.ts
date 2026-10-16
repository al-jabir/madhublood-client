import fs from "node:fs";
import { z } from "zod";
const fixtureSchema = z.object({
  runId: z.string(),
  password: z.string(),
  mfaSecret: z.string(),
  users: z
    .array(z.object({ id: z.string(), name: z.string(), phone: z.string() }))
    .length(3),
});
export function readAccounts() {
  const file = process.env.E2E_ACCOUNTS_FILE;
  if (!file)
    throw new Error(
      "Set E2E_ACCOUNTS_FILE to backend-generated test credentials.",
    );
  return fixtureSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}
