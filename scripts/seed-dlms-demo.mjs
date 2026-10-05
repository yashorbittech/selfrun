#!/usr/bin/env node
/**
 * DLMS (Digi Locker) demo seeder (standalone). Creates DLMS-role logins, per-employee client assignments and company + client
 * credentials / URLs / notes / (file-less) documents, including expired and soon-to-expire items. Safe to re-run.
 *
 *   node --env-file=.env scripts/seed-dlms-demo.mjs        # point MONGODB_URI at a scratch database to avoid the real one
 *
 * Needs DLMS_ENCRYPTION_KEY (openssl rand -base64 32) for the demo passwords to be stored; without it credentials are seeded with no password.
 * (It also runs as part of `npm run db:seed-demo`.)
 */
import { MongoClient } from "mongodb";
import { seedDlms, DLMS_DEMO_ACCOUNTS } from "./demo/dlms.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-dlms-demo.mjs");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 DLMS demo seeder (database: ${db.databaseName})`);
  const res = await seedDlms(db);
  console.log(`   ${res.credentials} credentials, ${res.links} URLs/accounts, ${res.documents} documents, ${res.notes} notes${res.encrypted ? "" : " — DLMS_ENCRYPTION_KEY not set: no passwords stored"}`);
  console.log("\nDLMS demo logins (password for all: Demo@12345) — sign in at /dlms/login");
  for (const a of DLMS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(44)} ${a.email}`);
} catch (err) {
  console.error("❌ DLMS demo seeder failed:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
