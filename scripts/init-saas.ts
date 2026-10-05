/**
 * Sets up an EMPTY database as the SaaS platform: the operator company (the company that runs the product and holds the
 * platform staff) with its first staff account, and the Panel Registry. A new deployment does this by itself on first
 * start when SAAS_ADMIN_EMAIL is set; this command is the manual alternative. It does nothing if an operator exists.
 *
 *   npm run db:init-saas -- --email you@company.com [--name "Your Name"] [--password '...']
 */

import { clientPromise } from "@/lib/platform/tenancy/platform-db";
import { ensureOperator } from "@/lib/saas/bootstrap";

const args = process.argv.slice(2);
const arg = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
};

async function main() {
  const email = arg("email");
  if (!email) {
    console.error("✗ --email is required (the first platform staff account).");
    process.exit(1);
  }
  const res = await ensureOperator({ email, name: arg("name"), password: arg("password") });
  if (!res.created) return console.log("Already set up: a platform operator exists. Nothing to do.");
  console.log(`✓ Platform operator "${res.companyName}" created (${res.panelsAdded} panels)`);
  console.log(`✓ Platform staff: ${res.email}${res.temporaryPassword ? `   temporary password: ${res.temporaryPassword}  (change it at first sign-in)` : ""}`);
}

main()
  .then(async () => (await clientPromise).close())
  .catch(async (err) => {
    console.error(err);
    await (await clientPromise).close().catch(() => {});
    process.exit(1);
  });
