#!/usr/bin/env node
/**
 * Social Media (SMMS) demo seeder (standalone). Safe to re-run.
 *
 *   npm run db:seed-smms          # uses .env
 *
 * Seeds: 4 SMMS logins (one per role), brand context (only if none exists), 3 campaigns with 5 ads, 9 posts across every
 * status with recorded performance, version history and an activity log. No OpenAI calls and no media files.
 * Point MONGODB_URI (or SEED_DB) at a scratch database to keep demo data out of the real one.
 */
import { MongoClient } from "mongodb";
import { seedSmms, SMMS_DEMO_ACCOUNTS } from "./demo/smms.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-smms-demo.mjs");
  process.exit(1);
}
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 Social Media demo seeder (database: ${db.databaseName})`);
  const r = await seedSmms(db);
  console.log(`   ${r.campaigns} campaigns, ${r.ads} ads, ${r.posts} posts, ${r.generations} versions${r.linkedLms ? " · launched campaign linked to LMS ad data" : ""}`);
  console.log("\nSocial Media demo logins (password for all: Demo@12345) — sign in at /smms/login");
  for (const a of SMMS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(44)} ${a.email}`);
} catch (err) {
  console.error("❌ Social Media demo seeder failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.close();
}
