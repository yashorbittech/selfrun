/**
 * Seeds a small, realistic demo dataset for AI Intelligence into ONE company of a
 * TEST database (refuses any database whose name does not contain "test"):
 * clients, projects, team assignments, tasks, timesheets, employees, departments,
 * leave, leads, invoices, receipts, expenses, vendors and purchase orders — the
 * same typed fixture the unit tests use (`scripts/lib/intelligence-fixture.ts`),
 * with dates relative to today so "this month / this year / delayed" stay true.
 * It also creates three sign-ins (all with the same password):
 *
 *   owner@<slug>.test    Super Admin                 (asks about everything)
 *   analyst@<slug>.test  AI Intelligence + Projects + CRM roles, NO Finance (the "not available" case)
 *   finance@<slug>.test  AI Intelligence + Finance
 *
 * Run (the company is created when it does not exist yet; re-running replaces the demo rows only):
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27099/ai_demo_test \
 *     npx --yes tsx --require ./scripts/lib/next-server-shims.cjs scripts/seed-intelligence-demo.ts \
 *     --slug acme [--password 'Demo#Pass12345'] [--plan starter]
 *
 *   --plan starter   puts the company on the Starter plan (no AI Intelligence): the "upgrade page" case.
 *                    Without --plan the company keeps whatever it has; a brand-new company has every panel.
 *   For the Growth plan the seeder makes sure the plan in this TEST database includes the "intelligence" panel.
 */
import { clientPromise, getPlatformDb } from "@/lib/platform/tenancy/platform-db";
import { runAsCompany } from "@/lib/platform/tenancy/context";
import { getDb } from "@/lib/mongodb";
import { createCompanyWithOwner } from "@/lib/platform/tenancy/provisioning";
import { listPlans } from "@/lib/platform/billing/plans";
import { hashPassword } from "@/lib/lms-auth";
import { seed } from "./lib/intelligence-fixture";

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const fail = (m: string): never => {
  console.error(`✗ ${m}`);
  process.exit(1);
};

const COLLECTIONS = ["pms_clients", "pms_projects", "pms_project_members", "pms_tasks", "pms_timesheets", "hrms_employees", "hrms_departments", "hrms_leave_requests", "lead_records", "fms_invoices", "fms_receipts", "prms_expenses", "prms_vendors", "prms_purchase_orders"];

async function main() {
  const platform = await getPlatformDb();
  if (!/test/.test(platform.databaseName)) fail(`Refusing to seed "${platform.databaseName}": the database name must contain "test".`);
  const slug = (arg("slug") ?? "").trim().toLowerCase() || fail("--slug is required");
  const password = arg("password") ?? "Demo#Pass12345";
  const plan = arg("plan");
  const passwordHash = hashPassword(password);

  let company = await platform.collection("companies").findOne({ slug });
  if (!company) {
    const res = await createCompanyWithOwner({ name: slug[0].toUpperCase() + slug.slice(1), slug, owner: { email: `owner@${slug}.test`, name: "Demo Owner", passwordHash, mustChangePassword: false } });
    if (!res.ok) fail(res.error);
    company = await platform.collection("companies").findOne({ slug });
  }
  const companyId = String(company!._id);

  if (plan) {
    await listPlans(); // make sure the default catalogue exists in this database
    const now = new Date();
    await platform.collection("companies").updateOne({ _id: companyId as never }, { $set: { subscription: { planId: plan, status: "active", interval: "monthly", trialEndsAt: null, currentPeriodStart: now, currentPeriodEnd: null, cancelAtPeriodEnd: false, graceEndsAt: null, provider: null, updatedAt: now } } });
  }
  // The plans in this TEST database may predate the panel: make sure Growth includes it.
  const growth = await platform.collection("billing_plans").findOne({ _id: "growth" as never });
  if (growth && Array.isArray(growth.modules) && !growth.modules.includes("intelligence")) await platform.collection("billing_plans").updateOne({ _id: "growth" as never }, { $push: { modules: "intelligence" } as never });

  await runAsCompany(companyId, async () => {
    const db = await getDb();
    const now = new Date();
    const users: [string, string[]][] = [
      [`owner@${slug}.test`, ["super_admin"]],
      [`analyst@${slug}.test`, ["intelligence_user", "pms_manager", "lms_manager"]],
      [`finance@${slug}.test`, ["intelligence_user", "finance_manager"]],
    ];
    for (const [email, roles] of users) {
      await db.collection("admin_users").updateOne(
        { email },
        { $set: { passwordHash, roles, permissionOverrides: {}, mustChangePassword: false, failedLoginAttempts: 0, lockedUntil: null, updatedAt: now }, $setOnInsert: { email, name: email.split("@")[0], userType: "system", employeeId: null, createdAt: now, lastLoginAt: null } },
        { upsert: true },
      );
    }
    // Re-running replaces only the demo rows (ids prefixed "demo-").
    for (const c of COLLECTIONS) await db.collection(c).deleteMany({ _id: { $regex: /^demo-/ } as never });
    await seed("demo", { amount: 1, extraActive: 3 });
  });

  console.log(`✓ Demo data for AI Intelligence seeded into company "${slug}" (${companyId})`);
  console.log(`  Sign in at http://${slug}.localhost:<port>/workspace/login — password for all three: ${password}`);
  console.log(`    owner@${slug}.test    Super Admin`);
  console.log(`    analyst@${slug}.test  no Finance access`);
  console.log(`    finance@${slug}.test  Finance access`);
  console.log(`  Expect: 5 active clients, 2 delayed projects, this month's invoiced revenue ₹1,50,000 (Finance/owner only).`);
}

main()
  .then(async () => (await clientPromise).close())
  .catch(async (err) => {
    console.error(err);
    await (await clientPromise).close().catch(() => {});
    process.exit(1);
  });
