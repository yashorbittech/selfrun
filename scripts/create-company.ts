/**
 * Creates a company (tenant) with its founding Super Admin from the command
 * line — the same code path as self-serve sign-up (`createCompanyWithOwner`),
 * so both produce identical workspaces: company, owner, and the automatic
 * `<slug>.<PLATFORM_ROOT_DOMAIN>` address attached at the hosting provider.
 *
 *   npm run db:create-company -- --name "Acme Labs" --slug acme --admin-email owner@acme.com [--admin-name "Asha Rao"] [--admin-password '...']
 *
 *  --admin-password  omitted → a random one is generated and printed once (the account must change it at first sign-in)
 *
 * Custom domains are added from the workspace's Domains settings.
 */

import { randomBytes } from "node:crypto";
import { clientPromise } from "@/lib/platform/tenancy/platform-db";
import { createCompanyWithOwner, isSlugTaken } from "@/lib/platform/tenancy/provisioning";
import { hashPassword } from "@/lib/lms-auth";

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function main() {
  const name = arg("name")?.trim() || fail("--name is required");
  const slug = arg("slug")?.trim().toLowerCase() || fail("--slug is required");
  const email = arg("admin-email")?.trim().toLowerCase() || fail("--admin-email is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("--admin-email is not an email address");
  if (await isSlugTaken(slug)) fail(`A company with slug "${slug}" already exists`);
  const generated = !arg("admin-password");
  const password = arg("admin-password") ?? randomBytes(9).toString("base64url");

  const result = await createCompanyWithOwner({
    name,
    slug,
    owner: { email, name: arg("admin-name")?.trim() || email.split("@")[0], passwordHash: hashPassword(password), mustChangePassword: generated },
  });
  if (!result.ok) fail(result.error);

  console.log(`✓ Company "${name}" (${slug}) created: ${result.companyId}`);
  console.log(`  Address: ${result.host}${result.hostingError ? `  (hosting provider: ${result.hostingError})` : ""}`);
  console.log(`  Super Admin: ${email}${generated ? `  temporary password: ${password}  (must be changed at first sign-in)` : ""}`);
}

main()
  .then(async () => (await clientPromise).close())
  .catch(async (err) => {
    console.error(err);
    await (await clientPromise).close().catch(() => {});
    process.exit(1);
  });
