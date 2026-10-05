#!/usr/bin/env node
/**
 * CMS panel demo seeder (standalone). CMS-role logins, the "Current Website / Default" theme
 * (active) plus an "AI Technology" theme (published, not active), and the migrated CMS pages.
 * Safe to re-run — never overwrites a page or theme someone has since edited.
 *
 *   node --env-file=.env scripts/seed-cms-demo.mjs        # SEED_DB=<name> to target another database
 */
import { MongoClient } from "mongodb";
import { seedCms, CMS_DEMO_ACCOUNTS } from "./demo/cms.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-cms-demo.mjs");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 CMS demo seeder (database: ${db.databaseName})`);
  const res = await seedCms(db);
  console.log(`   ${res.accounts} demo accounts, 2 themes (default active), ${res.pages} page(s) (${res.publishedPages} published)`);
  console.log("\nCMS demo logins (password for all: Demo@12345) — sign in at /cms/login");
  for (const a of CMS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(20)} ${a.email}`);
} catch (err) {
  console.error("❌ CMS demo seeder failed:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
