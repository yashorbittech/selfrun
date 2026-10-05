#!/usr/bin/env node
/**
 * OTS careers screening tests (standalone). Safe to re-run.
 *
 *   npm run db:seed-ots-careers          # uses .env
 *
 * One screening test per job on the public careers page, with role-specific questions, assigned by position to the
 * real applicants in `career_applications` (never invents applicants). `db:seed-ots` already includes this.
 * Point MONGODB_URI (or SEED_DB) at a scratch database to keep demo data out of the real one.
 */
import { MongoClient } from "mongodb";
import { seedOtsCareers } from "./demo/ots-careers.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-ots-careers-demo.mjs");
  process.exit(1);
}
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 OTS careers screening seeder (database: ${db.databaseName})`);
  const actor = await db.collection("admin_users").findOne({ email: "demo.ots.manager@example.com" }, { projection: { _id: 1 } });
  const evaluator = await db.collection("admin_users").findOne({ email: "demo.ots.evaluator@example.com" }, { projection: { _id: 1 } });
  const r = await seedOtsCareers(db, { actorId: actor?._id.toString() ?? null, evaluatorId: evaluator?._id.toString() ?? null });
  console.log(`   ${r.tests} role screening tests, ${r.questions} questions`);
  console.log(`   ${r.rolesWithApplicants} roles have applicants → ${r.assignments} assignments, ${r.attempts} attempts (${r.pendingEvaluation} awaiting evaluation)`);
} catch (err) {
  console.error("❌ OTS careers seeder failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.close();
}
