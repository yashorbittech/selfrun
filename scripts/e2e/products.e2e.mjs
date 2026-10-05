/**
 * End-to-end check of the Products section against a RUNNING production build:
 * the header menu, /products, every /products/<slug>, the demo form, JSON-LD, the sitemap, mobile layout
 * on the platform owner's site, and that a tenant's site gets none of it.
 *
 *   OWNER_BASE_URL=http://localhost:3006 \
 *   TENANT_BASE_URL=http://acme.localhost:3006 \
 *     node scripts/e2e/products.e2e.mjs
 *
 * OWNER_BASE_URL  = a host that routes to the platform-owner company (its products collection must be migrated:
 *                   `npm run db:migrate-cms-content -- --apply`, then scripts/add-products-nav.ts --apply).
 * TENANT_BASE_URL = a host of any other company (e.g. a company created with scripts/create-company.ts).
 * The demo form's validation is exercised with an EMPTY submit only (the API answers 422), so no lead is created.
 * Company hosts are reached through the browser (Node cannot resolve *.localhost).
 */

import assert from "node:assert/strict";
import { chromium } from "playwright";

const OWNER = process.env.OWNER_BASE_URL?.replace(/\/$/, "");
const TENANT = process.env.TENANT_BASE_URL?.replace(/\/$/, "");
if (!OWNER || !TENANT) {
  console.error("Set OWNER_BASE_URL and TENANT_BASE_URL.");
  process.exit(1);
}

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${err instanceof Error ? err.message.split("\n").slice(0, 4).join("\n      ") : String(err)}`);
  }
}

const SECTIONS = ["problem", "compare", "overview", "tour", "create-workspace", "features", "ai", "automation", "use-cases", "benefits", "audience", "integrations", "faqs", "related", "demo"];
const FEATURED_TITLE = "Automate Your Business with Our AI-Powered Business Automation SaaS";

/** The first <section> of a page (its hero) must carry a background image that really loaded. */
async function assertHeroImage(p, label) {
  const img = p.locator("section").first().locator("img").first();
  await img.waitFor({ state: "attached", timeout: 15_000 });
  const src = await img.getAttribute("src");
  assert.ok(src, `${label}: hero image has no src`);
  const res = await p.request.get(new URL(src, p.url()).toString());
  assert.equal(res.status(), 200, `${label}: hero image request ${src}`);
  assert.match(res.headers()["content-type"] ?? "", /^image\//, `${label}: hero image content-type`);
  await p.waitForFunction((el) => el.complete && el.naturalWidth > 0, await img.elementHandle(), { timeout: 15_000 });
}

/** Lazy images: every image below the hero (except the priority featured card) is lazy and has an alt attribute. */
async function assertImagesLazyWithAlt(p, label) {
  const bad = await p.$$eval("div.min-h-screen > section:not(:first-of-type) img:not([data-products-featured] img)", (imgs) =>
    imgs.filter((i) => i.getAttribute("alt") === null || i.getAttribute("loading") !== "lazy").map((i) => i.currentSrc || i.src));
  assert.deepEqual(bad, [], `${label}: images without alt or lazy loading`);
}

/** What a header dropdown is made of: the classes of each layer, so two menus can be compared structurally. */
const PANEL = 'header div[class*="max-w-5xl"][class*="-translate-x-1/2"]';
const normalise = (c) => c.replace(/max-h-\[[^\]]+\]|overflow-y-auto|overscroll-contain/g, "").replace(/\s+/g, " ").trim();
async function dropdownSignature(page, name) {
  const nav = page.locator('header nav[aria-label="Global"]');
  await nav.getByRole("link", { name, exact: true }).hover();
  const panel = page.locator(PANEL).first();
  await panel.waitFor({ state: "visible", timeout: 10_000 });
  return panel.evaluate((el) => {
    const cls = (n) => (n ? n.getAttribute("class") ?? "" : "");
    const ring = el.querySelector(":scope > div > div.relative");
    const grid = el.querySelector("div.grid.grid-cols-5");
    const featured = grid?.children[0];
    const featuredLink = featured?.querySelector(":scope > a");
    const list = grid?.children[1];
    const first = list?.querySelector("a");
    return {
      panel: cls(el), ring: cls(ring), accentBar: cls(ring?.children[0]), grid: cls(grid), featured: cls(featured), featuredLink: cls(featuredLink),
      featuredImage: cls(featuredLink?.querySelector("img")), list: cls(list), item: cls(first), itemIcon: cls(first?.children[0]), itemText: cls(first?.children[1]), itemCount: list?.querySelectorAll("a").length ?? 0,
    };
  });
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
  const errors = [];
  const newPage = async () => {
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    p.on("console", (m) => {
      // A 404 from a deliberately missing asset is not a script error; real script errors are.
      if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`);
    });
    return p;
  };
  const status = async (url) => {
    const p = await context.newPage();
    try {
      const res = await p.goto(url, { waitUntil: "domcontentloaded" });
      return { status: res.status(), body: await res.text() };
    } finally {
      await p.close();
    }
  };

  // ── owner: header ──────────────────────────────────────────────────────
  console.log(`owner (${OWNER})`);
  const page = await newPage();
  await page.goto(`${OWNER}/`, { waitUntil: "domcontentloaded" });

  let slugs = [];
  await check("/products: the featured business-automation card comes first, then the product cards (the site's listing card), each linking to its page", async () => {
    const res = await page.goto(`${OWNER}/products`, { waitUntil: "domcontentloaded" });
    assert.equal(res.status(), 200);
    await page.waitForSelector("[data-products-grid] a");
    const links = await page.$$eval('[data-products-grid] a[href^="/products/"]', (as) => as.map((a) => a.getAttribute("href")));
    slugs = [...new Set(links.map((h) => h.replace("/products/", "")))];
    assert.equal(slugs.length, 20, `expected the 20-product catalogue, found ${slugs.length}`);
    assert.ok(slugs.includes("business-automation-saas"), "Business Automation SaaS missing");
    assert.equal(links.length, slugs.length, "one card per product");
    assert.ok(slugs.includes("ai-intelligence"), "AI Intelligence missing");
    for (const must of ["hrms-suite", "fms-finance", "sop-policies", "cms-website", "staff-hub", "business-automation-saas"]) assert.ok(slugs.includes(must), `${must} missing`);
    // featured card: exact title, before the grid, wider than one grid column
    const featured = page.locator("[data-products-featured]");
    assert.equal((await featured.getByRole("heading", { level: 2 }).innerText()).trim(), FEATURED_TITLE);
    const order = await page.evaluate(() => document.querySelector("[data-products-featured]").compareDocumentPosition(document.querySelector("[data-products-grid]")) & Node.DOCUMENT_POSITION_FOLLOWING);
    assert.ok(order, "the featured card must come before the product grid");
    const fBox = await featured.boundingBox();
    const cardBox = await page.locator('[data-products-grid] a[href^="/products/"]').first().boundingBox();
    assert.ok(fBox.width > cardBox.width * 1.8, `featured card (${fBox.width}) should be much wider than a product card (${cardBox.width})`);
    const cta = featured.getByRole("link", { name: "Start Automating Your Business" });
    assert.equal(await cta.getAttribute("href"), "/signup");
    assert.equal(await featured.getByRole("link", { name: "Explore the Platform" }).getAttribute("href"), "/services/our-saas-product");
    assert.ok((await featured.locator("span", { hasText: /Every product in one workspace|Workflow automation across all of them|AI that answers from your own data|One sign-in, one set of roles/ }).count()) >= 3, "capability chips");
    assert.equal((await page.request.get(`${OWNER}/services/our-saas-product`)).status(), 200, "the card's destination exists");
    // the filter chip counts every product
    assert.ok(await page.getByRole("button", { name: /^All products\s*20$/ }).count(), "All products chip shows 20");
    // every card shows its call to action; the pills narrow the grid and "All products" restores it
    assert.equal(await page.locator('[data-products-grid] a[aria-label$="Explore Product"]').count(), slugs.length);
    await page.getByRole("button", { name: /^AI & Intelligence/ }).click();
    const some = await page.locator("[data-products-grid] a").count();
    assert.ok(some >= 2 && some < slugs.length, `filter showed ${some}`);
    await page.getByRole("button", { name: /^All products/ }).click();
    assert.equal(await page.locator("[data-products-grid] a").count(), slugs.length);
  });

  await check("/products: hero like the other listing heroes (background photo loaded, one h1), signup + demo CTAs, connected-platform and AI sections, demo form", async () => {
    await page.goto(`${OWNER}/products`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal((await page.locator("h1").innerText()).trim(), "Our Products");
    await assertHeroImage(page, "/products");
    const hero = page.locator("section").first();
    assert.equal(await hero.getByRole("link", { name: "Start Automating Your Business" }).getAttribute("href"), "/signup");
    assert.equal(await hero.getByRole("link", { name: "Request Demo" }).getAttribute("href"), "#demo");
    assert.ok(await page.getByText("One connected platform").first().isVisible());
    assert.ok(await page.getByText("AI where the work happens").first().isVisible());
    assert.equal(await page.locator("#demo-heading").count(), 1);
    assert.ok(await page.locator("#demo form").count());
    assert.equal(await page.locator('#demo [data-signup-cta="final"]').getAttribute("href"), "/signup");
    // the AI list never includes a product that says it has no AI of its own
    assert.equal(await page.locator("section", { hasText: "AI where the work happens" }).getByText("No AI of its own").count(), 0);
    await assertImagesLazyWithAlt(page, "/products");
    // every explore-the-platform target resolves
    assert.equal((await status(`${OWNER}/signup`)).status, 200);
  });

  await check("header: the Products dropdown is built exactly like the Services dropdown (same layers, classes, card, item markup)", async () => {
    await page.goto(`${OWNER}/`, { waitUntil: "domcontentloaded" });
    const services = await dropdownSignature(page, "Services");
    await page.mouse.move(5, 600);
    await page.locator(PANEL).first().waitFor({ state: "detached", timeout: 5_000 });
    const products = await dropdownSignature(page, "Products");
    for (const layer of ["panel", "ring", "accentBar", "grid", "featured", "featuredLink", "featuredImage", "item", "itemIcon", "itemText"]) assert.equal(normalise(products[layer]), normalise(services[layer]), `layer "${layer}" differs from the Services dropdown`);
    // the item list differs only by the scroll guard a long list needs
    assert.equal(normalise(products.list), normalise(services.list));
    assert.ok(products.itemCount >= 20, `menu lists ${products.itemCount} products`);
    assert.ok(!/grid-cols-3/.test(products.list), "no custom 3-column layout");
    // contents: AI Intelligence, the featured card, the signup call to action, View all
    const panel = page.locator(PANEL).first();
    assert.equal(await panel.getByRole("link", { name: /AI Intelligence/ }).first().getAttribute("href"), "/products/ai-intelligence");
    assert.ok(await panel.locator('a[href="/products/business-automation-saas"]').count(), "the dropdown lists the new product");
    assert.ok(await panel.getByText(FEATURED_TITLE).isVisible());
    assert.equal(await panel.getByRole("link", { name: "Start Automating Your Business" }).getAttribute("href"), "/signup");
    assert.equal(await panel.getByRole("link", { name: /View all Products/i }).getAttribute("href"), "/products");
    assert.equal(await panel.locator("p", { hasText: /^(Executive & Operations|HR & Talent|AI & Intelligence)$/ }).count(), 0, "no category headings");
    for (const n of ["Services", "Industries", "About"]) assert.ok(await page.locator('header nav[aria-label="Global"]').getByRole("link", { name: n, exact: true }).count(), `${n} nav item gone`);
  });

  await check("header: open/close behaviour is the same as Services (hover opens, leaving closes, focus/Escape do what they do there), and the list stays on screen", async () => {
    const behaviour = async (name) => {
      await page.goto(`${OWNER}/`, { waitUntil: "domcontentloaded" });
      const link = page.locator('header nav[aria-label="Global"]').getByRole("link", { name, exact: true });
      const open = () => page.locator(PANEL).count();
      const r = {};
      await link.focus();
      await page.waitForTimeout(400);
      r.opensOnFocus = (await open()) > 0;
      await link.hover();
      await page.locator(PANEL).first().waitFor({ state: "visible", timeout: 10_000 });
      r.opensOnHover = true;
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
      r.escapeCloses = (await open()) === 0;
      await page.mouse.move(5, 600);
      // The menu closes after a short delay plus its exit animation: wait for it to leave the DOM rather than a fixed time.
      r.closesOnLeave = await page.locator(PANEL).first().waitFor({ state: "detached", timeout: 4000 }).then(() => true).catch(() => false);
      return r;
    };
    const s = await behaviour("Services");
    const pr = await behaviour("Products");
    assert.deepEqual(pr, s, "Products must behave like Services");
    assert.equal(pr.opensOnHover && pr.closesOnLeave, true);
    // a long list is kept on screen: either it fits, or the item list scrolls inside the card
    for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1280, height: 600 }]) {
      const m = await newPage();
      await m.setViewportSize(vp);
      await m.goto(`${OWNER}/`, { waitUntil: "domcontentloaded" });
      const panel = m.locator(PANEL).first();
      // Measure once the open animation has settled; a loaded machine can drop the hover, so open it again if it closed.
      let box = null;
      for (let attempt = 0; attempt < 3 && !box; attempt++) {
        await m.locator('header nav[aria-label="Global"]').getByRole("link", { name: "Products", exact: true }).hover();
        await panel.waitFor({ state: "visible", timeout: 10_000 });
        await m.waitForTimeout(500);
        box = await panel.boundingBox();
      }
      assert.ok(box, `${vp.width}x${vp.height}: the dropdown did not stay open to be measured`);
      assert.ok(box.x >= 0 && box.x + box.width <= vp.width + 1, `${vp.width}x${vp.height}: dropdown leaves the screen sideways`);
      const list = panel.locator("div.col-span-3").first();
      const { sh, ch, oy } = await list.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight, oy: getComputedStyle(el).overflowY }));
      assert.ok(box.y + box.height <= vp.height + 1 || (sh > ch && oy === "auto"), `${vp.width}x${vp.height}: dropdown runs off the bottom without scrolling`);
      assert.ok(box.y + box.height <= vp.height + 2, `${vp.width}x${vp.height}: dropdown bottom ${box.y + box.height} beyond ${vp.height}`);
      await m.close();
    }
  });

  await check("header: dark mode shows the same dropdown, readable", async () => {
    const d = await newPage();
    await d.goto(`${OWNER}/`, { waitUntil: "domcontentloaded" });
    await d.locator('button[aria-label="Switch to dark mode"]:visible').first().click();
    await d.waitForFunction(() => document.documentElement.classList.contains("dark"));
    const sig = await dropdownSignature(d, "Products");
    assert.ok(sig.itemCount >= 20);
    const panel = d.locator(PANEL).first();
    assert.ok(await panel.getByRole("link", { name: "Start Automating Your Business" }).isVisible());
    const bg = await panel.locator("div.relative.overflow-hidden").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.ok(bg && bg !== "rgba(0, 0, 0, 0)", `dropdown has a background in dark mode (${bg})`);
    await d.close();
  });

  await check("header: the mobile menu is the same accordion as Services (same item markup), Products lists every product without headings", async () => {
    const m = await newPage();
    await m.setViewportSize({ width: 390, height: 844 });
    await m.goto(`${OWNER}/`, { waitUntil: "domcontentloaded" });
    await m.getByRole("button", { name: "Open main menu" }).click();
    const itemClass = async (section, sample) => {
      await m.getByRole("button", { name: section, exact: true }).click();
      const link = m.getByRole("link", { name: sample }).first();
      await link.waitFor({ state: "visible", timeout: 10_000 });
      return { cls: normalise((await link.getAttribute("class")) ?? ""), expanded: await m.getByRole("button", { name: section, exact: true }).getAttribute("aria-expanded") };
    };
    const svc = await itemClass("Services", "Software Development");
    const prod = await itemClass("Products", "AI Intelligence");
    assert.equal(prod.cls.replace(/border-primary bg-primary\/5 font-semibold text-primary|border-transparent text-muted-foreground hover:bg-muted\/50 hover:text-primary/, ""), svc.cls.replace(/border-primary bg-primary\/5 font-semibold text-primary|border-transparent text-muted-foreground hover:bg-muted\/50 hover:text-primary/, ""), "mobile item markup differs");
    assert.equal(prod.expanded, "true");
    assert.equal(await m.locator('a[href^="/products/"]').count() >= 20, true);
    assert.equal(await m.getByText(/^(Executive & Operations|Assessment & Security)$/).count(), 0, "no category headings in the mobile menu");
    assert.equal(await m.getByRole("link", { name: /View All Products/i }).first().getAttribute("href"), "/products");
    await m.close();
  });

  // ── owner: every product page ─────────────────────────────────────────
  console.log("product pages");
  for (const slug of slugs) {
    await check(`/products/${slug}: 200, sections, CTAs, JSON-LD, images`, async () => {
      const p = await newPage();
      try {
        const res = await p.goto(`${OWNER}/products/${slug}`, { waitUntil: "domcontentloaded" });
        assert.equal(res.status(), 200);
        assert.equal(await p.locator("h1").count(), 1, "exactly one h1");
        assert.ok((await p.locator("h1").innerText()).trim().length > 2);
        const missing = [];
        for (const id of SECTIONS) if (!(await p.locator(`#${id}`).count())) missing.push(id);
        assert.deepEqual(missing, [], `sections missing: ${missing.join(", ")}`);
        // breadcrumb back to Products (in the hero)
        const hero = p.locator("section").first();
        assert.equal(await hero.locator('a[href="/products"]').count(), 1);
        // the hero has its background image, really loaded
        await assertHeroImage(p, slug);
        // the problem section: an introduction, 4-6 problem cards, and a without/with comparison
        const cards = await p.locator("#problem [data-problem-card]").count();
        assert.ok(cards >= 4 && cards <= 6, `${cards} problem cards`);
        assert.ok((await p.locator("#problem p").nth(1).innerText()).length > 60, "problem introduction");
        assert.ok((await p.locator("#compare [data-compare-row]").count()) >= 3, "before/after pairs");
        assert.ok(await p.locator("#compare").getByText("Without it").first().isVisible());
        assert.ok(await p.locator("#compare").getByText("With it").first().isVisible());
        // the facts strip is in the hero
        assert.ok((await hero.locator("[data-product-facts] > div").count()) >= 1, "facts strip");
        // signup CTAs: hero (Get Started + Create Your Business Automation), the mid-page band, the final band
        assert.equal(await hero.getByRole("link", { name: "Get Started" }).getAttribute("href"), "/signup");
        assert.equal(await hero.getByRole("link", { name: "Create Your Business Automation" }).getAttribute("href"), "/signup");
        assert.equal(await p.locator("#create-workspace").getByRole("link", { name: "Create Your Business Automation" }).getAttribute("href"), "/signup");
        assert.equal(await p.locator('#demo [data-signup-cta="final"]').getAttribute("href"), "/signup");
        // CTAs: Request Demo -> the demo form, Start Using -> the workspace sign-in with next
        assert.equal(await hero.getByRole("link", { name: "Request Demo" }).getAttribute("href"), "#demo");
        const start = hero.getByRole("link", { name: "Start Using" });
        if (slug === "web-portal") assert.equal(await start.count(), 0, "the public website has no panel to sign in to");
        else assert.match(await start.getAttribute("href"), /^\/workspace\/login\?next=%2F/);
        // JSON-LD present, parseable, with the right types
        const blocks = await p.$$eval('script[type="application/ld+json"]', (ss) => ss.map((s) => s.textContent));
        const types = blocks.map((b) => JSON.parse(b)["@type"]);
        assert.ok(types.includes("SoftwareApplication") && types.includes("BreadcrumbList"), `JSON-LD types: ${types}`);
        const app = blocks.map((b) => JSON.parse(b)).find((j) => j["@type"] === "SoftwareApplication");
        assert.ok(app.url.startsWith(OWNER) || app.url.startsWith("https://"), app.url);
        assert.equal("offers" in app, false);
        // canonical + og
        assert.match((await p.locator('link[rel="canonical"]').getAttribute("href")) ?? "", new RegExp(`/products/${slug}$`));
        assert.ok(await p.locator('meta[property="og:image"]').count(), "og:image missing");
        // scroll through so lazy images load, then no broken <img>
        await p.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 40));
          }
          window.scrollTo(0, 0);
        });
        await p.waitForTimeout(400);
        const broken = await p.$$eval("img", (imgs) => imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc));
        assert.deepEqual(broken, [], "broken images");
        await assertImagesLazyWithAlt(p, slug);
      } finally {
        await p.close();
      }
    });
  }

  await check("the Request Demo form renders, validates (empty submit -> field errors, no lead created) and the select lists the products", async () => {
    const p = await newPage();
    await p.goto(`${OWNER}/products/ai-intelligence`, { waitUntil: "domcontentloaded" });
    const form = p.locator("#demo-form");
    await form.scrollIntoViewIfNeeded();
    assert.equal(await form.locator("#demo-product").inputValue(), "AI Intelligence — Your AI Data Analyst", "the page's product is preselected");
    assert.ok((await form.locator("#demo-product option").count()) > slugs.length);
    await form.getByRole("button", { name: /Request demo/i }).click();
    await p.getByText("Name is required.").waitFor({ timeout: 15_000 });
    assert.ok(await p.getByText("Email is required.").isVisible());
    assert.ok(await p.getByText("Phone number is required.").isVisible());
    await p.close();
  });

  await check("Start Using leads to the workspace sign-in, carrying the product's panel", async () => {
    const p = await newPage();
    await p.goto(`${OWNER}/products/hrms-suite`, { waitUntil: "domcontentloaded" });
    await p.locator("section").first().getByRole("link", { name: "Start Using" }).click();
    await p.waitForURL(/\/workspace\/login/, { timeout: 30_000 });
    assert.equal(new URL(p.url()).searchParams.get("next"), "/hrms");
    await p.close();
  });

  await check("Get Started leads to the sign-up page", async () => {
    const p = await newPage();
    await p.goto(`${OWNER}/products/hrms-suite`, { waitUntil: "domcontentloaded" });
    await p.locator("section").first().getByRole("link", { name: "Get Started" }).click();
    await p.waitForURL(/\/signup/, { timeout: 30_000 });
    await p.close();
  });

  await check("/products JSON-LD: ItemList of every product + BreadcrumbList", async () => {
    await page.goto(`${OWNER}/products`, { waitUntil: "domcontentloaded" });
    const lds = (await page.$$eval('script[type="application/ld+json"]', (ss) => ss.map((s) => s.textContent))).map((t) => JSON.parse(t));
    const list = lds.find((j) => j["@type"] === "ItemList");
    assert.ok(list, "ItemList missing");
    assert.equal(list.itemListElement.length, slugs.length);
    assert.equal(list.itemListElement.length, 20);
    assert.ok(lds.some((j) => j["@type"] === "BreadcrumbList"));
  });

  await check("sitemap.xml contains /products and every product page", async () => {
    const res = await status(`${OWNER}/sitemap.xml`);
    assert.equal(res.status, 200);
    const locs = [...res.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    assert.ok(locs.includes("/products"));
    const missing = slugs.filter((s) => !locs.includes(`/products/${s}`));
    assert.deepEqual(missing, []);
    assert.ok(locs.includes("/products/business-automation-saas"));
  });

  await check("/products/business-automation-saas: the Business Automation page opens with its sections, automations content and Start Using into the automations settings", async () => {
    const p = await newPage();
    try {
      const res = await p.goto(`${OWNER}/products/business-automation-saas`, { waitUntil: "domcontentloaded" });
      assert.equal(res.status(), 200);
      assert.match((await p.locator("h1").innerText()).trim(), /Business Automation/);
      for (const id of ["problem", "compare", "features", "ai", "automation", "integrations", "faqs"]) assert.ok(await p.locator(`#${id}`).count(), `#${id} missing`);
      assert.ok(await p.locator("#automation").getByText("New lead to sales team").count(), "workflow shown");
      assert.equal(await p.locator("section").first().getByRole("link", { name: "Start Using" }).getAttribute("href"), `/workspace/login?next=${encodeURIComponent("/workspace/settings/automations")}`);
      assert.ok(await p.locator('#integrations a[href="/products/staff-hub"]').count(), "links to the Workspace");
    } finally {
      await p.close();
    }
  });

  await check("an unknown product slug is a 404", async () => {
    assert.equal((await status(`${OWNER}/products/not-a-product`)).status, 404);
  });

  await check("existing URLs still work: the catalogue page and the services page", async () => {
    assert.equal((await status(`${OWNER}/services/our-saas-product`)).status, 200);
    assert.equal((await status(`${OWNER}/services`)).status, 200);
  });

  await check("390px: no horizontal scroll on /products and on every product page", async () => {
    const m = await newPage();
    await m.setViewportSize({ width: 390, height: 844 });
    for (const url of [`${OWNER}/products`, ...slugs.map((s) => `${OWNER}/products/${s}`)]) {
      await m.goto(url, { waitUntil: "networkidle" });
      const { sw, cw } = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      assert.ok(sw <= cw + 1, `${url}: scrollWidth ${sw} > clientWidth ${cw}`);
    }
    await m.close();
  });

  await check("no page errors on any page visited", () => {
    assert.deepEqual(errors, []);
  });

  // ── tenant ─────────────────────────────────────────────────────────────
  console.log(`tenant (${TENANT})`);
  const t = await newPage();
  await t.goto(`${TENANT}/`, { waitUntil: "domcontentloaded" });
  // The tenant's own site is served; fetch from inside the page (Node cannot resolve *.localhost).
  const tenantStatus = (path) => t.evaluate(async (p) => (await fetch(p, { redirect: "manual" })).status, path);
  const tenantText = (path) => t.evaluate(async (p) => (await fetch(p)).text(), path);

  await check("the tenant's header has no Products item or product links", async () => {
    await t.goto(`${TENANT}/`, { waitUntil: "networkidle" });
    assert.equal(await t.locator('header a[href="/products"], header a[href^="/products/"]').count(), 0);
    assert.equal(await t.locator('header').getByText("AI Intelligence", { exact: true }).count(), 0);
    assert.equal(await t.locator('footer a[href="/products"]').count(), 0);
  });
  await check("/products and every /products/<slug> are 404 on the tenant", async () => {
    assert.equal(await tenantStatus("/products"), 404);
    const notFound = [];
    for (const s of slugs) if ((await tenantStatus(`/products/${s}`)) !== 404) notFound.push(s);
    assert.deepEqual(notFound, []);
    assert.equal(await tenantStatus("/products/opengraph-image"), 404);
  });
  await check("the tenant's sitemap lists no Products URLs", async () => {
    const xml = await tenantText("/sitemap.xml");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    assert.ok(locs.length > 0);
    assert.deepEqual(locs.filter((p) => p === "/products" || p.startsWith("/products/")), []);
  });
  await check("the tenant's own pages still work", async () => {
    assert.equal(await tenantStatus("/"), 200);
  });
} finally {
  await browser.close();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
