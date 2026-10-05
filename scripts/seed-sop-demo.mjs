#!/usr/bin/env node
/**
 * SOP panel demo seeder (standalone). Creates a small HRMS org if none exists, SOP-role logins, and SOPs covering every lifecycle
 * state / confidentiality level / version history / acknowledgement state. Safe to re-run.
 *
 *   node --env-file=.env scripts/seed-sop-demo.mjs        # SEED_DB=<name> to target another database
 *
 * (It also runs as part of `npm run db:seed-demo`.)
 */
import { MongoClient } from "mongodb";
import { seedSop, SOP_DEMO_ACCOUNTS } from "./demo/sop.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-sop-demo.mjs");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 SOP demo seeder (database: ${db.databaseName})`);
  const res = await seedSop(db);
  console.log(`   ${res.sops} SOPs, ${res.versions} versions, ${res.assignments} assignments`);
  console.log("\nSOP demo logins (password for all: Demo@12345) — sign in at /sop/login");
  for (const a of SOP_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(36)} ${a.email}`);
} catch (err) {
  console.error("❌ SOP demo seeder failed:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
