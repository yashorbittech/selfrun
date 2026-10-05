/**
 * Browser test for the SaaS product / operator separation: the product website on the SaaS host (styled pages, demo and
 * contact forms, workspace finder), the platform staff signing in on the SaaS host and reaching the Platform Panel, and a
 * customer host that has no Platform Panel but still serves its public site.
 *
 * Against a RUNNING production build with a local test database that has been through `npm run db:separate-operator`:
 *
 *   SAAS_HOSTS=localhost  (the SaaS host is http://localhost:<port>; a customer is served on <slug>.localhost)
 *   SAAS_BASE=http://localhost:3011 CUSTOMER_BASE=http://acme.localhost:3011 \
 *   STAFF_EMAIL=staff@op.test STAFF_PASSWORD='...' CUSTOMER_PAGE=/services/web-app-development \
 *   WORKSPACE_INPUT=acme.localhost WORKSPACE_REDIRECT_RE='^https://acme\.test/workspace/login' \
 *   node scripts/e2e/operator-separation.e2e.mjs
 */
import { chromium } from "playwright";
const SAAS = process.env.SAAS_BASE, CUST = process.env.CUSTOMER_BASE;
const STAFF_EMAIL = process.env.STAFF_EMAIL, STAFF_PASSWORD = process.env.STAFF_PASSWORD;
if (!SAAS || !CUST || !STAFF_EMAIL || !STAFF_PASSWORD) { console.error("Set SAAS_BASE, CUSTOMER_BASE, STAFF_EMAIL and STAFF_PASSWORD."); process.exit(2); }
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const step = async (name, fn) => { try { await fn(); results.push("✓ " + name); } catch (e) { results.push("✗ " + name + " — " + String(e.message).split("\n")[0]); } };
const ctx = await browser.newContext();
let page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await step("SaaS home renders styled marketing page", async () => {
  await page.goto(SAAS + "/", { waitUntil: "networkidle" });
  const h1 = await page.locator("h1").first().textContent();
  if (!/runs itself/i.test(h1 ?? "")) throw new Error("h1: " + h1);
  const font = await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontWeight);
  if (Number(font) < 700) throw new Error("not styled, weight " + font);
});
await step("Demo form submits and is stored", async () => {
  await page.goto(SAAS + "/demo", { waitUntil: "networkidle" });
  await page.fill("#name", "Test Person"); await page.fill("#email", "test@example.com"); await page.fill("#company", "Acme Test");
  await page.click("button[type=submit]");
  await page.getByText("Thank you").waitFor({ timeout: 8000 });
});
await step("Contact form validates", async () => {
  await page.goto(SAAS + "/contact", { waitUntil: "networkidle" });
  await page.fill("#name", "T"); await page.fill("#email", "bad"); await page.fill("#message", "short");
  await page.click("button[type=submit]");
  await page.getByText("Please enter your name").waitFor({ timeout: 8000 });
});
await step("Login page finds a workspace and redirects to it", async () => {
  await page.goto(SAAS + "/login", { waitUntil: "networkidle" });
  await page.fill("#workspace", process.env.WORKSPACE_INPUT ?? "");
  const target = new Promise((res) => page.on("request", (r) => new RegExp(process.env.WORKSPACE_REDIRECT_RE ?? "").test(r.url()) && res(r.url())));
  await page.click("button[type=submit]");
  const url = await Promise.race([target, new Promise((_, rej) => setTimeout(() => rej(new Error("no redirect")), 10000))]);
  if (!new RegExp(process.env.WORKSPACE_REDIRECT_RE ?? "").test(url)) throw new Error("went to " + url);
});
await step("Unknown workspace shows an error", async () => {
  page = await (await browser.newContext()).newPage();
  await page.goto(SAAS + "/login", { waitUntil: "networkidle" });
  await page.fill("#workspace", "nope-nope");
  await page.click("button[type=submit]");
  await page.getByText("couldn't find a workspace").waitFor({ timeout: 8000 });
});
await step("Operator staff signs in on the SaaS host and reaches the Platform Panel", async () => {
  page = await (await browser.newContext()).newPage();
  await page.goto(SAAS + "/workspace/login", { waitUntil: "networkidle" });
  await page.fill("input[type=email]", STAFF_EMAIL); await page.fill("input[type=password]", STAFF_PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 45000 });
  await page.goto(SAAS + "/platform", { waitUntil: "networkidle" });
  if (!/\/platform/.test(page.url())) throw new Error("landed on " + page.url());
  const body = (await page.locator("body").innerText()).slice(0, 400);
  if (/not found|404/i.test(body)) throw new Error("page says: " + body.slice(0, 120));
});
await step("Customer host has no Platform Panel", async () => {
  const p2 = await (await browser.newContext()).newPage();
  const r = await p2.goto(CUST + "/platform", { waitUntil: "networkidle" });
  if (r.status() !== 404) throw new Error("status " + r.status());
});
await step("Customer public page still renders", async () => {
  const p2 = await (await browser.newContext()).newPage();
  const r = await p2.goto(CUST + (process.env.CUSTOMER_PAGE ?? "/"), { waitUntil: "networkidle" });
  if (r.status() !== 200) throw new Error("status " + r.status());
});
console.log(results.join("\n")); if (errors.length) console.log("page errors:", errors.slice(0, 3));
await browser.close();
process.exit(results.some((r) => r.startsWith("✗")) ? 1 : 0);
