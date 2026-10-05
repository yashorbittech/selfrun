/**
 * Browser test for AI Intelligence against a RUNNING production build whose OpenAI
 * is the scripted mock. Setup (see the headers of the two scripts):
 *
 *   1. MONGODB_URI=mongodb://127.0.0.1:27099/<name with "test"> npx tsx --require ./scripts/lib/next-server-shims.cjs \
 *        scripts/seed-intelligence-demo.ts --slug acme                       # owner / analyst / finance sign-ins + data
 *      ... --slug acmestarter --plan starter                                  # optional: a company WITHOUT the panel
 *   2. node scripts/mock-openai-intelligence.mjs --port 4010
 *   3. OPENAI_API_KEY=sk-mock OPENAI_BASE_URL=http://127.0.0.1:4010/v1 npx next start -p 3006   (after `next build`)
 *   4. TEST_COMPANY_URL=http://acme.localhost:3006 \
 *      TEST_COMPANY_EMAIL=owner@acme.test TEST_COMPANY_PASSWORD='Demo#Pass12345' \
 *      [TEST_NOFINANCE_EMAIL=analyst@acme.test] [TEST_NOFINANCE_PASSWORD=...] \
 *      [LOCKED_COMPANY_URL=http://acmestarter.localhost:3006 LOCKED_COMPANY_EMAIL=owner@acmestarter.test LOCKED_COMPANY_PASSWORD=...] \
 *      node scripts/e2e/intelligence.e2e.mjs
 *
 * Company hosts are reached with page.evaluate(fetch) (Node cannot resolve *.localhost).
 * Expected demo numbers (from the seed): 5 active clients, 2 delayed projects.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const COMPANY_URL = process.env.TEST_COMPANY_URL;
const EMAIL = process.env.TEST_COMPANY_EMAIL;
const PASSWORD = process.env.TEST_COMPANY_PASSWORD;
const NOFIN_EMAIL = process.env.TEST_NOFINANCE_EMAIL ?? (EMAIL ? EMAIL.replace(/^owner@/, "analyst@") : undefined);
const NOFIN_PASSWORD = process.env.TEST_NOFINANCE_PASSWORD ?? PASSWORD;
const LOCKED_URL = process.env.LOCKED_COMPANY_URL;
const LOCKED_EMAIL = process.env.LOCKED_COMPANY_EMAIL;
const LOCKED_PASSWORD = process.env.LOCKED_COMPANY_PASSWORD;
const EXPECT_ACTIVE_CLIENTS = process.env.EXPECT_ACTIVE_CLIENTS ?? "5";
if (!COMPANY_URL || !EMAIL || !PASSWORD) {
  console.error("Set TEST_COMPANY_URL, TEST_COMPANY_EMAIL and TEST_COMPANY_PASSWORD.");
  process.exit(2);
}

let passed = 0;
const failures = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
  }
}

async function signIn(page, origin, email, password) {
  await page.goto(`${origin}/workspace/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 60_000 }), page.press('input[name="password"]', "Enter")]);
  // A company whose setup is still open lands in the onboarding wizard first; skipping it is the way into the dashboard.
  if (new URL(page.url()).pathname === "/workspace/onboarding") {
    await Promise.all([page.waitForURL((u) => u.pathname === "/workspace", { timeout: 30_000 }), page.getByRole("button", { name: "Skip for now" }).click()]);
  }
}

const pathOf = (page) => new URL(page.url()).pathname;
const apiPost = (page, path, body) =>
  page.evaluate(async ([p, b]) => {
    const r = await fetch(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
    return { status: r.status, text: (await r.text()).slice(0, 400) };
  }, [path, body]);
const statusOf = (page, path) => page.evaluate(async (p) => (await fetch(p, { redirect: "manual" })).status, path);
const noHorizontalScroll = async (page, label) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `${label} scrolls horizontally by ${overflow}px`);
};

/** Types a question and waits for the finished answer (the status line goes away). */
async function ask(page, question) {
  const before = await page.locator('[data-testid="answer"]').count();
  await page.getByLabel("Ask a question").fill(question);
  await page.getByRole("button", { name: "Send question" }).click();
  await page.locator('[data-testid="answer"]').nth(before).waitFor();
  await page.locator('[data-testid="answer"]').nth(before).locator('[data-testid="status"]').waitFor({ state: "detached", timeout: 45_000 });
  return page.locator('[data-testid="answer"]').nth(before);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const pageErrors = [];
let firstConversationUrl = "";

try {
  const ctx = await browser.newContext({ acceptDownloads: true, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await step("sign in, then open AI Intelligence from the Staff Hub tile", async () => {
    await signIn(page, COMPANY_URL, EMAIL, PASSWORD);
    await page.goto(`${COMPANY_URL}/workspace`);
    const tile = page.locator('[data-module="intelligence"]:not([data-locked])');
    await tile.waitFor({ timeout: 30_000 });
    await Promise.all([page.waitForURL((u) => u.pathname === "/intelligence", { timeout: 30_000 }), tile.locator("a").first().click()]);
    await page.getByRole("heading", { name: "Ask about your business" }).waitFor();
    await page.getByText("What you can ask").first().waitFor();
    assert.ok((await page.getByRole("button", { name: "Send question" }).isDisabled()), "send is disabled until a question is typed");
  });

  await step("a KPI question: a KPI block with the real number, and 'How this was calculated'", async () => {
    const answer = await ask(page, "How many active clients do we have?");
    const kpi = answer.locator('[data-block="kpi"]');
    await kpi.waitFor();
    assert.match(await kpi.innerText(), new RegExp(`Active clients\\s*${EXPECT_ACTIVE_CLIENTS}`));
    assert.match(await answer.innerText(), new RegExp(`${EXPECT_ACTIVE_CLIENTS} active clients`));
    const how = answer.locator('[data-testid="how-calculated"]');
    await how.getByRole("button", { name: "How this was calculated" }).click();
    const text = await how.innerText();
    assert.match(text, /Clients/);
    assert.match(text, /Status is active/);
    assert.match(text, /Number of records/);
    // The URL now carries the new conversation (no page reload happened).
    assert.match(pathOf(page), /^\/intelligence\/c\/[0-9a-f-]{36}$/);
    firstConversationUrl = page.url();
  });

  await step("a table question: scroll-x table, copy as table and CSV download", async () => {
    const answer = await ask(page, "Which projects are delayed?");
    const table = answer.locator('[data-block="table"]');
    await table.waitFor();
    assert.equal(await table.locator("tbody tr").count(), 2, "two delayed projects in the demo data");
    assert.match(await table.innerText(), /Website Redesign/);
    assert.match(await table.innerText(), /ERP Rollout/);
    await table.getByRole("button", { name: "Copy as table" }).click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(clip, /Project name\t/);
    assert.match(clip, /Website Redesign\t/);
    const [download] = await Promise.all([page.waitForEvent("download"), table.getByRole("button", { name: "Download CSV" }).click()]);
    assert.match(download.suggestedFilename(), /\.csv$/);
    const csv = await readFile(await download.path(), "utf8");
    assert.match(csv.split("\r\n")[0], /Project name/);
    assert.match(csv, /Website Redesign/);
    // Copy the answer text.
    // The copy control sits under the answer box, in the same message row.
    await answer.locator("xpath=..").getByRole("button", { name: "Copy answer" }).click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /past (its|their) end date/);
  });

  await step("a chart question: an accessible chart plus its data table", async () => {
    const answer = await ask(page, "Show monthly revenue for this year as a chart.");
    const chart = answer.locator('[data-block="chart"]');
    await chart.waitFor();
    await chart.locator("svg").first().waitFor();
    const label = await chart.locator('[role="img"]').first().getAttribute("aria-label");
    assert.match(label ?? "", /line chart: Monthly revenue/);
    await answer.locator('[data-block="table"]').waitFor();
    assert.ok((await answer.locator('[data-testid="how-calculated"]').count()) === 1);
  });

  await step("new conversation: history lists both, deleting works, and a reload shows the stored answers", async () => {
    await page.getByRole("link", { name: "New conversation" }).first().click();
    await page.getByRole("heading", { name: "Ask about your business" }).waitFor();
    assert.equal(await page.locator('[data-testid="answer"]').count(), 0, "a fresh conversation is empty");
    const second = await ask(page, "hello");
    assert.match(await second.innerText(), /AI Data Analyst/);
    const rows = page.locator('[data-testid="conversation-row"]');
    assert.ok((await rows.count()) >= 2, `history has both conversations (${await rows.count()})`);
    const titles = await rows.allInnerTexts();
    assert.ok(titles.some((t) => /How many active clients/.test(t)) && titles.some((t) => /hello/.test(t)), titles.join(" | "));
    const secondUrl = page.url();
    // Reload: the conversation comes back from the database (blocks included), nothing is re-asked.
    await page.reload();
    await page.locator('[data-testid="answer"]').first().waitFor();
    assert.match(await page.locator('[data-testid="answer"]').first().innerText(), /AI Data Analyst/);
    // Open the first conversation from the sidebar: its KPI and table are re-rendered from storage.
    await page.goto(firstConversationUrl);
    await page.locator('[data-block="kpi"]').waitFor();
    await page.locator('[data-block="table"]').first().waitFor();
    await page.locator('[data-block="chart"] svg').first().waitFor();
    // Delete the "hello" conversation.
    await page.goto(secondUrl);
    const row = page.locator('[data-testid="conversation-row"]', { hasText: "hello" });
    await row.hover();
    await row.getByRole("button", { name: /Delete hello/ }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/intelligence", { timeout: 15_000 });
    await row.waitFor({ state: "detached" });
    assert.equal(await statusOf(page, new URL(secondUrl).pathname), 404, "a deleted conversation is gone");
  });

  await step("API guards: anonymous 401; empty question 400; someone else's conversation 404", async () => {
    await page.goto(`${COMPANY_URL}/intelligence`);
    assert.equal((await apiPost(page, "/api/intelligence/chat", { message: "   " })).status, 400);
    assert.equal((await apiPost(page, "/api/intelligence/chat", { message: "hi", conversationId: "00000000-0000-0000-0000-000000000000" })).status, 404);
    const anon = await browser.newContext();
    const ap = await anon.newPage();
    await ap.goto(`${COMPANY_URL}/workspace/login`);
    assert.equal((await apiPost(ap, "/api/intelligence/chat", { message: "hi" })).status, 401);
    await ap.goto(`${COMPANY_URL}/intelligence`);
    assert.equal(pathOf(ap), "/workspace/login");
    assert.equal(new URL(ap.url()).searchParams.get("next"), "/intelligence");
    await anon.close();
  });

  await step("390px: no horizontal scroll with a table and a chart on screen", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(firstConversationUrl);
    await page.locator('[data-block="table"]').first().waitFor();
    await page.locator('[data-block="chart"] svg').first().waitFor();
    await noHorizontalScroll(page, "conversation page");
    await page.goto(`${COMPANY_URL}/intelligence`);
    await page.getByRole("heading", { name: "Ask about your business" }).waitFor();
    await noHorizontalScroll(page, "new conversation");
    // The menu opens the same sidebar (history + examples).
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByText("What you can ask").last().waitFor();
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  if (NOFIN_EMAIL && NOFIN_PASSWORD) {
    await step("a user without Finance access asking about revenue gets the 'not available' answer", async () => {
      const c2 = await browser.newContext();
      const p2 = await c2.newPage();
      p2.on("pageerror", (e) => pageErrors.push(e.message));
      await signIn(p2, COMPANY_URL, NOFIN_EMAIL, NOFIN_PASSWORD);
      await p2.goto(`${COMPANY_URL}/intelligence`);
      await p2.getByRole("heading", { name: "Ask about your business" }).waitFor();
      // Their examples come from their own entities: nothing about revenue or invoices.
      // Only the example list is checked: the conversation history above it holds earlier questions of this
      // same user (on a re-run, "What is this month's revenue?" is a title there, which is fine).
      const sidebarText = (await p2.locator("nav").allInnerTexts()).join(" ");
      const examples = sidebarText.split(/what you can ask/i)[1] ?? "";
      assert.ok(examples.trim().length > 20, "the example list is shown");
      assert.ok(!/revenue|invoice|unpaid/i.test(examples), `finance examples leaked into the sidebar: ${examples.slice(0, 200)}`);
      const answer = await ask(p2, "What is this month's revenue?");
      assert.match(await answer.innerText(), /isn't available to you because of your access permissions/);
      assert.equal(await answer.locator('[data-block="kpi"]').count(), 0, "no number is shown");
      assert.ok(!/₹/.test(await answer.innerText()));
      // And they can still ask about what they may see.
      const ok = await ask(p2, "How many active clients do we have?");
      await ok.locator('[data-block="kpi"]').waitFor();
      // Their conversations are theirs alone: the owner's conversation URL is a 404 for them.
      assert.equal(await statusOf(p2, new URL(firstConversationUrl).pathname), 404);
      await c2.close();
    });
  } else console.log("  - skipped: set TEST_NOFINANCE_EMAIL/PASSWORD for the no-Finance check");

  if (LOCKED_URL && LOCKED_EMAIL && LOCKED_PASSWORD) {
    await step("a company whose plan lacks the panel gets the upgrade page", async () => {
      const c3 = await browser.newContext();
      const p3 = await c3.newPage();
      await signIn(p3, LOCKED_URL, LOCKED_EMAIL, LOCKED_PASSWORD);
      await p3.goto(`${LOCKED_URL}/workspace`);
      await p3.locator('[data-module="intelligence"][data-locked="true"]').waitFor({ timeout: 30_000 });
      await p3.goto(`${LOCKED_URL}/intelligence`);
      assert.equal(pathOf(p3), "/workspace/upgrade");
      assert.equal(new URL(p3.url()).searchParams.get("module"), "intelligence");
      assert.equal((await apiPost(p3, "/api/intelligence/chat", { message: "hi" })).status, 403);
      await c3.close();
    });
  } else console.log("  - skipped: set LOCKED_COMPANY_URL/EMAIL/PASSWORD for the upgrade-page check");

  await step("no page errors", async () => {
    assert.deepEqual(pageErrors, []);
  });

  await ctx.close();
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failures.length} failed${failures.length ? `: ${failures.join("; ")}` : ""}`);
process.exit(failures.length ? 1 : 0);
