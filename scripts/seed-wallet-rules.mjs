#!/usr/bin/env node
// Seeds default Wallet reward rules (idempotent: skips a type+role that already has a live rule).
// Run: npm run db:seed-wallet-rules
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-wallet-rules.mjs");
  process.exit(1);
}

const DEFAULTS = [
  { type: "signup", appliesToRole: "ALL", amount: 100, expiresInDays: 90 },
  { type: "referral_referrer", appliesToRole: "ALL", amount: 250, expiresInDays: 180 },
  { type: "referral_referee", appliesToRole: "ALL", amount: 150, expiresInDays: 90 },
  // More ways to earn (activity rewards)
  { type: "stage_complete", appliesToRole: "ALL", amount: 20, expiresInDays: 120 },
  { type: "stage_complete", appliesToRole: "ALL", subKey: "certificate_issued", amount: 100, expiresInDays: 180 },
  { type: "stage_complete", appliesToRole: "ALL", subKey: "joined", amount: 100, expiresInDays: 180 },
  { type: "daily_visit", appliesToRole: "ALL", amount: 2, expiresInDays: 30 },
  { type: "streak_7", appliesToRole: "ALL", amount: 25, expiresInDays: 60 },
  { type: "profile_complete", appliesToRole: "ALL", amount: 30, expiresInDays: 90 },
  { type: "first_offer_claim", appliesToRole: "ALL", amount: 50, expiresInDays: 90 },
  { type: "first_payment", appliesToRole: "ALL", amount: 100, expiresInDays: 120 },
  { type: "interview_completed", appliesToRole: "ALL", amount: 25, expiresInDays: 90 },
  { type: "assignment_submit", appliesToRole: "ALL", amount: 10, expiresInDays: 60 },
  { type: "assignment_approved", appliesToRole: "ALL", amount: 20, expiresInDays: 60 },
  { type: "referral_milestone", appliesToRole: "ALL", subKey: "3", amount: 100, expiresInDays: 180 },
  { type: "referral_milestone", appliesToRole: "ALL", subKey: "5", amount: 250, expiresInDays: 180 },
  { type: "referral_milestone", appliesToRole: "ALL", subKey: "10", amount: 600, expiresInDays: 365 },
];

// Usage rules: where credits may be spent. Festival Offers is open by default; training fees and client invoices are opt-in, so seed them (up to 50% of the amount due).
const USAGE = [
  { module: "training", appliesToRole: "ALL", isEnabled: true, maxPercentOfPrice: 50, maxCreditsPerTransaction: null, minOrderValue: null },
  { module: "projects", appliesToRole: "ALL", isEnabled: true, maxPercentOfPrice: 50, maxCreditsPerTransaction: null, minOrderValue: null },
];

const client = new MongoClient(uri);
try {
  await client.connect();
  await assertSingleCompany(client.db());
  const col = client.db().collection("wallet_reward_rules");
  for (const d of DEFAULTS) {
    const exists = await col.findOne({ type: d.type, appliesToRole: d.appliesToRole, subKey: d.subKey ?? null, deletedAt: null });
    if (exists) {
      console.log(`skip  ${d.type}/${d.appliesToRole}${d.subKey ? "/" + d.subKey : ""} (exists)`);
      continue;
    }
    const now = new Date();
    await col.insertOne({ _id: randomUUID(), ...d, subKey: d.subKey ?? null, isActive: true, createdAt: now, updatedAt: now, createdBy: null, updatedBy: null, deletedAt: null });
    console.log(`added ${d.type}/${d.appliesToRole}${d.subKey ? "/" + d.subKey : ""} = ${d.amount}`);
  }
  const usage = client.db().collection("wallet_usage_rules");
  for (const u of USAGE) {
    if (await usage.findOne({ module: u.module, appliesToRole: u.appliesToRole, deletedAt: null })) {
      console.log(`skip  usage ${u.module}/${u.appliesToRole} (exists)`);
      continue;
    }
    const now = new Date();
    await usage.insertOne({ _id: randomUUID(), ...u, createdAt: now, updatedAt: now, createdBy: null, updatedBy: null, deletedAt: null });
    console.log(`added usage ${u.module}/${u.appliesToRole} = ${u.maxPercentOfPrice}%`);
  }
} finally {
  await client.close();
}
