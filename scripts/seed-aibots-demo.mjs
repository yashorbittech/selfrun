#!/usr/bin/env node
/**
 * AI Bots demo seeder (standalone). Safe to re-run.
 *
 *   npm run db:seed-aibots                                   # uses .env
 *   node --env-file=.env scripts/seed-aibots-demo.mjs --no-openai   # Mongo only, never touches OpenAI
 *
 * Seeds: 4 AI Bots logins, 6 bots (5 active, 1 restricted to sales roles), ~16 chats across the bots and "Start New Chat",
 * a month of usage (tokens, cost, failures) for the dashboard, and an activity log.
 *
 * When OPENAI_API_KEY is set (and --no-openai isn't passed) it ALSO creates, in that OpenAI account: a vector store per bot
 * with its demo knowledge documents, and an OpenAI Conversation per chat holding the chat's messages. Re-running deletes
 * the OpenAI objects the previous run created. Without a key, chats are metadata only and bots have no knowledge files.
 * Point MONGODB_URI at a scratch database to keep demo data out of the real one.
 */
import { MongoClient } from "mongodb";
import OpenAI from "openai";
import { seedAibots, AIBOTS_DEMO_ACCOUNTS } from "./demo/aibots.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-aibots-demo.mjs");
  process.exit(1);
}
const useOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim()) && !process.argv.includes("--no-openai");

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 AI Bots demo seeder (database: ${db.databaseName}; OpenAI: ${useOpenAI ? "yes" : "no — metadata only"})`);
  const res = await seedAibots(db, { openai: useOpenAI ? new OpenAI() : null, log: console.log });
  console.log(`   ${res.bots} bots (${res.active} active), ${res.files} knowledge files, ${res.chats} chats (${res.transcripts} with OpenAI transcripts), ${res.runs} usage rows, ${res.audit} activity entries`);
  if (!res.openai) console.log("   ℹ︎ No OpenAI key: bots have no knowledge files and seeded chats have no earlier messages (a new message starts a fresh conversation).");
  console.log("\nAI Bots demo logins (password for all: Demo@12345) — sign in at /aibots/login");
  for (const a of AIBOTS_DEMO_ACCOUNTS) console.log(`  • ${a.label.padEnd(44)} ${a.email}`);
} catch (err) {
  console.error("❌ AI Bots demo seeder failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.close();
}
