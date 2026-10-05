#!/usr/bin/env node
/**
 * Online Test System — PRODUCTION content seeder. Safe to re-run.
 *
 *   node --env-file=.env scripts/seed-ots-production.mjs          # dry run: shows what would be created
 *   node --env-file=.env scripts/seed-ots-production.mjs --yes    # writes
 *
 * Creates ONLY reusable assessment content for the roles on the public careers page
 * (`src/app/(site)/careers/jobs-data.ts`):
 *   - test category "Recruitment Screening" and one question category per role;
 *   - each role's question bank (questions written from that job's listed skills);
 *   - one published "<Role> Screening Test" per role (knowledge section + one written answer marked by an evaluator,
 *     results held for the hiring team, score-only for candidates).
 *
 * Existing seeder-created tests are brought up to the current question list and duration only while they have no
 * attempts and still have the seeder's own sections.
 *
 * It never creates users, logins, applicants, assignments, attempts, results, certificates or notifications, and never
 * overwrites or deletes anything: rows are keyed by stable `ots-careers-*` ids and inserted only when missing, so
 * edits made in the panel afterwards are preserved. Assign the tests to real applicants from OTS → Test Assignments
 * (target "Applicants by Position").
 */
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { CAREER_TESTS } from "./demo/ots-careers.mjs";
import { assertSingleCompany } from "./lib/single-company-guard.mjs";

const WRITE = process.argv.includes("--yes");
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env scripts/seed-ots-production.mjs [--yes]");
  process.exit(1);
}

const P = "ots-careers-";
const stamp = (d) => ({ createdAt: d, updatedAt: d, createdBy: null, updatedBy: null, deletedAt: null });

const CONFIG = (minutes) => ({
  durationMinutes: minutes,
  autoSubmit: true,
  startAt: null,
  endAt: null,
  maxAttempts: 1,
  allowRetake: false,
  retakeOnlyIfFailed: false,
  questionsPerAttempt: null,
  randomizeQuestions: false,
  randomizeOptions: true,
  negativeMarking: false,
  passMode: "percentage",
  passingPercentage: 60,
  passingMarks: 0,
  allowNavigation: true,
  allowBack: true,
  allowReview: true,
  resultRelease: "manual",
  resultDetail: "score",
  showExplanations: false,
  attemptScoring: "highest",
  security: { requireFullscreen: false, detectTabSwitch: true, blockCopyPaste: true, blockRightClick: true, singleSession: true, maxViolations: 5 },
});

const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.SEED_DB || undefined);
  await assertSingleCompany(db);
  console.log(`🌱 OTS production content seeder — database: ${db.databaseName} — ${WRITE ? "WRITING" : "DRY RUN (add --yes to write)"}`);
  const now = new Date();
  const plan = { categories: 0, questions: 0, tests: 0, updated: 0, skipped: 0 };

  async function nextCode(prefix, counter, pad) {
    if (!WRITE) return `${prefix}-(auto)`;
    const r = await db.collection("ots_counters").findOneAndUpdate({ _id: counter }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
    return `${prefix}-${String(r?.seq ?? 1).padStart(pad, "0")}`;
  }
  async function insertIfMissing(col, doc, kind) {
    if (await db.collection(col).findOne({ _id: doc._id }, { projection: { _id: 1 } })) {
      plan.skipped += 1;
      return false;
    }
    plan[kind] += 1;
    if (WRITE) await db.collection(col).insertOne(doc);
    return true;
  }
  /** Reuse a category that already exists with the same name (never create a duplicate). */
  async function category(kind, name, description, id) {
    const existing = await db.collection("ots_categories").findOne({ kind, name, deletedAt: null });
    if (existing) return existing._id;
    await insertIfMissing("ots_categories", { _id: id, kind, name, description, ...stamp(now) }, "categories");
    return id;
  }

  const testCatId = await category("test", "Recruitment Screening", "Screening tests for the roles on the careers page.", `${P}tc-screening`);
  const audit = [];

  for (const job of CAREER_TESTS) {
    const qCatId = await category("question", job.title, `Questions for the ${job.title} role (${job.category}).`, `${P}qc-${job.slug}`);
    const qs = [];
    for (const [i, q] of job.questions.entries()) {
      const id = `${P}q-${job.slug}-${i + 1}`;
      const existing = await db.collection("ots_questions").findOne({ _id: id }, { projection: { marks: 1, type: 1 } });
      const doc = existing ?? {
        _id: id,
        code: await nextCode("Q", "question_code", 5),
        type: q.type,
        prompt: q.prompt,
        media: null,
        categoryId: qCatId,
        subject: job.title,
        topic: q.topic,
        difficulty: q.difficulty,
        marks: q.marks ?? (q.difficulty === "advanced" ? 2 : 1),
        negativeMarks: 0,
        explanation: q.explanation ?? "",
        tags: [job.slug, "screening"],
        status: "active",
        definition: q.definition,
        version: 1,
        ...stamp(now),
      };
      if (!existing) await insertIfMissing("ots_questions", doc, "questions");
      else plan.skipped += 1;
      qs.push({ id, type: doc.type, marks: doc.marks });
    }

    const testId = `${P}t-${job.slug}`;
    const objective = qs.filter((x) => x.type !== "long_answer");
    const written = qs.filter((x) => x.type === "long_answer");
    const instructions = `This test is part of your application for ${job.title}. You have ${job.minutes} minutes and one attempt. Answer the written question in your own words — the hiring team reviews it and shares results after evaluation.`;
    const existingTest = await db.collection("ots_tests").findOne({ _id: testId });
    if (existingTest) {
      // Bring a seeder-created test up to the current content (question list, duration) — but only while nobody has
      // taken it and its sections are still the seeder's own, so live tests and admin restructures are never touched.
      const attempts = await db.collection("ots_attempts").countDocuments({ testId });
      const ownSections = existingTest.sections.map((x) => x.id).join() === `${P}sec-${job.slug}-1,${P}sec-${job.slug}-2`;
      const wantIds = [objective.map((x) => x.id), written.map((x) => x.id)];
      const upToDate = existingTest.sections.every((x, i) => JSON.stringify(x.questionIds) === JSON.stringify(wantIds[i])) && existingTest.config.durationMinutes === job.minutes;
      if (upToDate || attempts > 0 || !ownSections) {
        if (!upToDate) console.log(`  ! ${existingTest.name}: left unchanged (${attempts > 0 ? `${attempts} attempt(s) exist` : "sections were edited in the panel"})`);
        plan.skipped += 1;
        continue;
      }
      const paperStats = { questionCount: qs.length, servedCount: qs.length, totalMarks: qs.reduce((t, x) => t + x.marks, 0), marksVary: false };
      plan.updated += 1;
      if (WRITE) {
        await db.collection("ots_tests").updateOne(
          { _id: testId },
          { $set: { "sections.0.questionIds": wantIds[0], "sections.1.questionIds": wantIds[1], "config.durationMinutes": job.minutes, instructions, paperStats, updatedAt: now, updatedBy: null } }
        );
        audit.push({ _id: randomUUID(), actorId: "system", actorEmail: null, action: "update", entity: "test", entityId: testId, entityLabel: existingTest.name, testId, summary: `Careers content seeder: ${existingTest.paperStats?.questionCount ?? "?"} → ${qs.length} questions, ${existingTest.config.durationMinutes} → ${job.minutes} min`, metadata: null, createdAt: now });
      }
      console.log(`  ↻ ${existingTest.name.padEnd(46)} ${existingTest.paperStats?.questionCount ?? "?"} → ${qs.length} questions · ${paperStats.totalMarks} marks · ${job.minutes} min`);
      continue;
    }
    const test = {
      _id: testId,
      code: await nextCode("TST", "test_code", 4),
      name: `${job.title} Screening Test`,
      description: `Pre-interview screening for the ${job.title} role (${job.category}): role knowledge plus one written response. Questions follow the skills listed on the careers page.`,
      categoryId: testCatId,
      testType: "screening",
      subject: job.title,
      departmentIds: [],
      designationIds: [],
      difficulty: "mixed",
      instructions,
      tags: [job.slug, "hiring"],
      language: "English",
      status: "published",
      config: CONFIG(job.minutes),
      sections: [
        { id: `${P}sec-${job.slug}-1`, title: "Role knowledge", description: "", timeLimitMinutes: null, negativeMarking: null, marksPerQuestion: null, questionIds: objective.map((x) => x.id), rules: [] },
        { id: `${P}sec-${job.slug}-2`, title: "Written response", description: "", timeLimitMinutes: null, negativeMarking: null, marksPerQuestion: null, questionIds: written.map((x) => x.id), rules: [] },
      ],
      certificate: { enabled: false, title: "", validityMonths: null },
      publishedAt: now,
      publishedBy: null,
      closedAt: null,
      archivedAt: null,
      paperStats: { questionCount: qs.length, servedCount: qs.length, totalMarks: qs.reduce((s, x) => s + x.marks, 0), marksVary: false },
      ...stamp(now),
    };
    await insertIfMissing("ots_tests", test, "tests");
    for (const action of ["create", "publish"])
      audit.push({ _id: randomUUID(), actorId: "system", actorEmail: null, action, entity: "test", entityId: testId, entityLabel: test.name, testId, summary: action === "create" ? "Created by the careers content seeder" : `${test.code} published`, metadata: null, createdAt: now });
    console.log(`  • ${test.name.padEnd(46)} ${qs.length} questions · ${test.paperStats.totalMarks} marks · ${job.minutes} min`);
  }
  if (WRITE && audit.length) await db.collection("ots_activity_logs").insertMany(audit);

  console.log(`\n${WRITE ? "Created" : "Would create"}: ${plan.categories} categories, ${plan.questions} questions, ${plan.tests} tests; ${WRITE ? "updated" : "would update"} ${plan.updated} tests (${plan.skipped} already up to date / left untouched).`);
  console.log("No users, assignments, attempts, results or notifications were created.");
} catch (err) {
  console.error("❌ OTS production seeder failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.close();
}
