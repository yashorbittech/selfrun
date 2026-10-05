#!/usr/bin/env node
/**
 * Online Test System (OTS) demo seeder (standalone). Safe to re-run.
 *
 *   npm run db:seed-ots          # uses .env
 *
 * Seeds: 6 staff logins (admin / manager / author / evaluator / two employees), an applicant and a student portal login,
 * test + question categories, ~48 questions across every question type, 8 tests across the lifecycle, assignments to a
 * department + role, individuals, all full-time employees, applicants and a TMS batch, with historical attempts, results,
 * certificates and an activity log. Reuses existing HRMS / Careers / TMS records wherever they exist.
 * Point MONGODB_URI (or SEED_DB) at a scratch database to keep demo data out of the real one.
 */
import { MongoClient } from "mongodb";
import { seedOts, OTS_DEMO_ACCOUNTS, OTS_PORTAL_ACCOUNTS } from "./demo/ots.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-ots-demo.mjs");
  process.exit(1);
}
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 Online Test System demo seeder (database: ${db.databaseName})`);
  const r = await seedOts(db);
  console.log(`   Careers screening: ${r.careers.tests} role tests (${r.careers.questions} questions), ${r.careers.rolesWithApplicants} roles with applicants → ${r.careers.assignments} assignments, ${r.careers.attempts} attempts (${r.careers.pendingEvaluation} awaiting evaluation)`);
  console.log(`   ${r.questions} questions, ${r.tests} tests, ${r.dispatches} assignment batches → ${r.assignments} assignments, ${r.attempts} attempts (${r.pendingEvaluation} awaiting evaluation), ${r.certificates} certificates`);
  console.log("\nOTS staff logins (password for all: Demo@12345) — sign in at /ots/login");
  for (const a of OTS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(44)} ${a.email}`);
  console.log("\nPortal logins (same password) — sign in at /login, then Tests");
  for (const a of OTS_PORTAL_ACCOUNTS) console.log(`  • ${a.label.padEnd(44)} ${a.email}`);
} catch (err) {
  console.error("❌ OTS demo seeder failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.close();
}
