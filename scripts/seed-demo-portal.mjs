#!/usr/bin/env node
/**
 * Demo seeder #2 — External Portal + everything it reads.
 *
 * Fills every section a portal user (Student, Intern, Client, Business, Hiring) can see — and the LMS / TMS / PMS / FMS /
 * Offers / Wallet screens behind them — with schema-correct, cross-linked data:
 *   TMS   programs, batches, students, enrolments, classes, attendance, assignments, submissions, certificates, fee plans, live projects, placements
 *   PMS   clients, projects, milestones, shared documents          FMS   invoices, receipts, credit notes
 *   LMS   lead records + timelines + messages for every portal account, career applications, interviews, job offers
 *   Portal ~165 accounts (students / interns / clients / businesses / applicants / brand-new signups), documents, notifications
 *   Offers 5 campaigns, 14+ offers each, coupons, claims, analytics events
 *   Wallet reward rules, usage rules, referral campaigns, referral network, per-user ledgers (consistent balances), streaks
 *   Panels HRMS org / employees / leave, FMS chart of accounts + ledger, TMS enquiries, audit trail of every module — plus removal of the
 *          wrong-shaped docs the legacy base seeder wrote (they crash pages)
 *
 * Safe to re-run: everything it creates has a `demo-` id (or `_demo` flag) and is replaced on each run.
 * Run after the base seeder (npm run db:seed-demo does both). Demo logins are printed at the end.
 *
 *   node --env-file=.env scripts/seed-demo-portal.mjs           # SEED_DB=<name> to target another database
 */
import { MongoClient } from "mongodb";
import { seedTms } from "./demo/tms.mjs";
import { seedPmsFms } from "./demo/pms.mjs";
import { seedPeople, DEMO_ACCOUNTS } from "./demo/people.mjs";
import { seedGrowth } from "./demo/growth.mjs";
import { seedPanels } from "./demo/panels.mjs";
import { seedMessenger } from "./demo/messenger.mjs";
import { seedChatbot } from "./demo/chatbot.mjs";
import { seedProcurement } from "./demo/procurement.mjs";
import { seedPrmsOps } from "./demo/prms-ops.mjs";
import { seedMarketing } from "./demo/marketing.mjs";
import { seedSop, SOP_DEMO_ACCOUNTS } from "./demo/sop.mjs";
import { seedDlms, DLMS_DEMO_ACCOUNTS } from "./demo/dlms.mjs";
import OpenAI from "openai";
import { seedAibots, AIBOTS_DEMO_ACCOUNTS } from "./demo/aibots.mjs";
import { seedSmms, SMMS_DEMO_ACCOUNTS } from "./demo/smms.mjs";
import { seedOts, OTS_DEMO_ACCOUNTS, OTS_PORTAL_ACCOUNTS } from "./demo/ots.mjs";
import { seedSeo, SEO_DEMO_ACCOUNTS } from "./demo/seo.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-demo-portal.mjs");
  process.exit(1);
}

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log("==========================================================================");
  console.log(`🌱 DEMO SEEDER — External Portal + linked panels  (database: ${db.databaseName})`);
  console.log("==========================================================================");

  console.log("\n[1/5] Training Management (TMS)…");
  const tms = await seedTms(db);
  console.log("\n[2/5] Projects & Finance (PMS / FMS)…");
  const pms = await seedPmsFms(db);
  console.log("\n[3/5] Portal accounts, leads, recruitment…");
  const people = await seedPeople(db, tms, pms);
  console.log("\n[4/5] Festival Offers + Wallet & Credits…");
  await seedGrowth(db, tms, pms, people);
  console.log("\n[5/5] Cross-panel repair + HRMS / FMS / audit trails…");
  await seedPanels(db, tms, pms);
  await seedMessenger(db, pms);
  await seedChatbot(db);
  await seedProcurement(db, pms);
  await seedPrmsOps(db, pms);
  await seedMarketing(db);
  console.log("\n[+] SOP panel…");
  const sop = await seedSop(db);
  console.log(`   ${sop.sops} SOPs, ${sop.versions} versions, ${sop.assignments} assignments`);
  console.log("\n[+] SEO panel…");
  const seo = await seedSeo(db);
  console.log(`   ${seo.keywords} keywords, ${seo.readings} position readings, ${seo.backlinks} backlinks, ${seo.tasks} tasks`);

  console.log("\n[+] DLMS (Digi Locker)…");
  const dlms = await seedDlms(db);
  console.log(`   ${dlms.credentials} credentials, ${dlms.links} URLs/accounts, ${dlms.documents} documents, ${dlms.notes} notes`);

  console.log("\n[+] AI Bots…");
  // Creates OpenAI vector stores + conversations only when a key is configured (see scripts/demo/aibots.mjs).
  const aibots = await seedAibots(db, { openai: process.env.OPENAI_API_KEY?.trim() ? new OpenAI() : null, log: console.log });
  console.log(`   ${aibots.bots} bots (${aibots.active} active), ${aibots.files} knowledge files, ${aibots.chats} chats, ${aibots.runs} usage rows${aibots.openai ? "" : " — no OpenAI key: metadata only"}`);

  console.log("\n[+] Social Media (SMMS)…");
  const smms = await seedSmms(db);
  console.log(`   ${smms.campaigns} campaigns, ${smms.ads} ads, ${smms.posts} posts, ${smms.generations} versions`);

  console.log("\n[+] Online Test System (OTS)…");
  const ots = await seedOts(db);
  console.log(`   ${ots.questions} questions, ${ots.tests} tests, ${ots.assignments} assignments, ${ots.attempts} attempts, ${ots.certificates} certificates`);

  console.log("\n==========================================================================");
  console.log("✨ Done. Portal demo logins (password for all: Demo@12345) — sign in at /login");
  console.log("==========================================================================");
  for (const a of DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  SOP panel logins (same password) — sign in at /sop/login");
  for (const a of SOP_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  SEO panel logins (same password) — sign in at /seo/login");
  for (const a of SEO_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  DLMS logins (same password) — sign in at /dlms/login");
  for (const a of DLMS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  AI Bots logins (same password) — sign in at /aibots/login");
  for (const a of AIBOTS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  Social Media logins (same password) — sign in at /smms/login");
  for (const a of SMMS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  Online Test System logins (same password) — sign in at /ots/login (applicant / student at /login)");
  for (const a of [...OTS_DEMO_ACCOUNTS, ...OTS_PORTAL_ACCOUNTS]) console.log(`  • ${a.label.padEnd(34)} ${a.email}`);
  console.log("\n  Every other seeded portal account uses the same password; find them in /lms/wallet → Balances.");
} catch (err) {
  console.error("❌ Demo seeder failed:", err);
  process.exitCode = 1;
} finally {
  await client.close();
}
