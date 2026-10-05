#!/usr/bin/env node
/**
 * SEO panel demo seeder (standalone). SEO-role logins plus sample keywords, rankings, backlinks, a competitor and
 * tasks. Safe to re-run. Crawl/audit data is not seeded — run a website audit from /seo/audit.
 *
 *   node --env-file=.env scripts/seed-seo-demo.mjs        # SEED_DB=<name> to target another database
 */
import { MongoClient } from "mongodb";
import { seedSeo, SEO_DEMO_ACCOUNTS } from "./demo/seo.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-seo-demo.mjs");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 SEO demo seeder (database: ${db.databaseName})`);
  const res = await seedSeo(db);
  console.log(`   ${res.keywords} keywords, ${res.readings} position readings, ${res.backlinks} backlinks, ${res.tasks} tasks`);
  console.log("\nSEO demo logins (password for all: Demo@12345) — sign in at /seo/login");
  for (const a of SEO_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(36)} ${a.email}`);
} catch (err) {
  console.error("❌ SEO demo seeder failed:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
