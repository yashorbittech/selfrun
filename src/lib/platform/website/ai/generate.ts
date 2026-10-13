import "server-only";
import { getOpenAI } from "@/lib/openai";
import { isBillingLimitError } from "@/lib/platform/billing/enforce";
import OpenAI from "openai";
import { randomUUID } from "node:crypto";
import { FONT_OPTIONS } from "@/lib/cms/theme-shared";
import type { ThemeComponentSelections } from "@/lib/cms/component-variants";
import { CARD_VARIANTS, DENSITY_VARIANTS, FOOTER_VARIANTS, HEADER_VARIANTS, IMAGE_VARIANTS, MENU_VARIANTS, SECTION_VARIANTS, WIDTH_VARIANTS } from "@/lib/cms/component-variants";
import { blockUsable, offeringSlug } from "@/lib/platform/website/starter-template";
import { BLOCK_KINDS, type StarterBlock, type StarterPack, type StarterService, type StarterStep, type StarterReason } from "@/lib/platform/website/starter-packs";
import { isHex, type Palette } from "@/lib/platform/website/ai/tokens";
import { resolveStyle, seededPick, STYLE_GROUPS, type StyleChoice } from "@/lib/platform/website/ai/style-recipes";
import type { WebsitePlan } from "@/lib/platform/website/ai/plan";

/**
 * Writes a company's whole website from what it actually does: its business categories and sub-categories, its name and country.
 * One OpenAI call returns structured JSON (the copy for every page + a design direction), which is validated here, so nothing
 * unchecked ever reaches the CMS. The copy is told to stay truthful: no invented statistics, clients, awards, testimonials,
 * addresses or phone numbers.
 */

export const WEBSITE_MODEL = () => process.env.WEBSITE_AI_MODEL || "gpt-4.1";
const IMAGE_MODEL = () => process.env.WEBSITE_AI_IMAGE_MODEL || "gpt-image-1";

export interface WebsiteBrief {
  name: string;
  slug: string;
  country: string;
  categories: string[];
  subCategories: { name: string; category: string }[];
  email: string;
  phone: string;
  /** What the sign-up request told us (country code, browser languages, time zone); any may be empty. */
  hints?: { country?: string; languages?: string; timezone?: string };
}

/**
 * The website is written with the company's own metered OpenAI client: every call counts against its monthly AI-token allowance (from the
 * very first generation at sign-up) and stops with a plain message once the allowance is used up.
 */
async function platformClient(): Promise<OpenAI> {
  try {
    return await getOpenAI({ timeoutMs: 170_000, maxRetries: 1 });
  } catch (err) {
    // For the operator's logs; the company sees the plain message.
    console.error("[ai-website] OpenAI is not connected on this server (add the key under Platform → Connections).");
    throw err;
  }
}

// ── What the model may choose from ──────────────────────────────────────────────────────────────────────────────────────────────────
const ICONS = ["Briefcase","Building2","Wrench","Hammer","HardHat","Package","ShoppingCart","Truck","Plane","Hotel","Coffee","Heart","HeartPulse","GraduationCap","BookOpen","Camera","Palette","PenTool","Music","Video","Megaphone","Handshake","Users","UserCheck","ShieldCheck","Lock","Leaf","Sprout","Tractor","Gauge","Settings","Rocket","Lightbulb","Star","Award","BadgeCheck","Clock","CalendarClock","MapPin","Phone","Mail","Globe","Wallet","CreditCard","Banknote","Calculator","Scale","Gavel","Home","Key","Sparkles","Smile","Baby","Wifi","Code2","Smartphone","Laptop","Server","Cloud","Cpu","BarChart3","LineChart","Target","CheckCircle2","FileText","ClipboardCheck","Layers","Boxes","Route","LifeBuoy","Gift","Trophy","Zap","Wand2","Compass","Search","Activity"];
const DESIGN_DIRECTIONS = [
  "warm and handcrafted — earthy colours, a friendly serif heading, generous spacing",
  "bold and energetic — saturated colours, strong sans headings, high contrast",
  "calm and clinical — soft cool colours, airy layout, very readable",
  "premium and editorial — deep colours, elegant serif headings, restrained accents",
  "friendly and playful — bright but balanced colours, rounded shapes, approachable tone",
  "rugged and dependable — strong dark neutrals with one confident accent colour",
  "fresh and natural — greens and soft neutrals, light and open",
  "modern and minimal — near-monochrome with a single sharp accent",
  "traditional and trustworthy — navy, maroon or forest tones, classic proportions",
  "vibrant and local — rich regional colours, lively but tidy",
  "sleek and technical — cool dark-leaning palette, crisp geometric type",
  "soft and elegant — muted pastels with a deep contrasting accent",
];

const keys = (list: { key: string }[]) => list.map((x) => x.key);
const str = { type: "string" } as const;
// No minItems/maxItems anywhere: counting constraints make the model stall in whitespace on long outputs. Counts are asked for in the prompt and checked in `toPack`.
const strs = (_n: number) => ({ type: "array", items: str }) as const;
const en = (values: string[]) => ({ type: "string", enum: values }) as const;
const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false }) as const;
const arr = (items: unknown, _min: number, _max: number) => ({ type: "array", items }) as const;
const icon = en(ICONS);

const SECTION_ORDER = ["why", "steps", "services", "faq", "cta"] as const;

const blockSchema = () => obj({ kind: en([...BLOCK_KINDS]), eyebrow: str, heading: str, text: str, items: arr(obj({ title: str, text: str, icon }), 1, 8), ctaLabel: str });

/** The site-wide parts: look, menu, footer and the shared copy. Pages are written in separate, smaller calls (see `writeWebsite`). */
function schemaCore() {
  const service = obj({ title: str, subtitle: str, description: str, icon, highlights: strs(3) });
  const reason = obj({ name: str, desc: str, icon });
  const step = obj({ title: str, description: str, icon });
  return obj({
    design: obj({
      mood: str,
      primary: str, secondary: str, accent: str,
      tone: en(["white", "warm", "cool", "tinted"]),
      radius: en(["0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem"]),
      headingFont: en(keys(FONT_OPTIONS)), bodyFont: en(keys(FONT_OPTIONS)),
      header: en(keys(HEADER_VARIANTS)), footer: en(keys(FOOTER_VARIANTS)), menu: en(keys(MENU_VARIANTS)),
      cards: en(keys(CARD_VARIANTS)), width: en(keys(WIDTH_VARIANTS)), density: en(keys(DENSITY_VARIANTS)), images: en(keys(IMAGE_VARIANTS)),
      homeOrder: arr(en([...SECTION_ORDER]), 5, 5),
      sectionVariants: obj(Object.fromEntries(Object.entries(SECTION_VARIANTS).map(([type, list]) => [type, en(keys(list))]))),
      style: obj(Object.fromEntries(Object.entries(STYLE_GROUPS).map(([group, options]) => [group, en([...options])]))),
    }),
    structure: obj({
      nav: arr(obj({ label: str, target: str }), 3, 6),
      footerColumns: arr(obj({ title: str, links: arr(obj({ label: str, target: str }), 2, 5) }), 2, 3),
      headerCta: str,
    }),
    pack: obj({
      hero: obj({ badge: str, line1: str, highlight: str, description: str, primaryCta: str, secondaryCta: str, chips: strs(3), status: strs(2), perf: strs(2) }),
      tagline: str,
      footerCta: obj({ badge: str, title: str, text: str, label: str }),
      servicesIntro: str,
      services: arr(service, 4, 8),
      why: obj({ eyebrow: str, icon, heading: str, description: str, reasons: arr(reason, 4, 4) }),
      steps: obj({ eyebrow: str, icon, heading: str, accent: str, description: str, items: arr(step, 4, 4), linkLabel: str }),
      faqs: arr(obj({ question: str, answer: str }), 6, 6),
      cta: obj({ heading: str, description: str, label: str, checklist: strs(3) }),
      about: obj({ intro: str, approachHeading: str, approachDescription: str, principles: arr(step, 3, 3) }),
      copy: obj({
        aboutCta: obj({ heading: str, description: str, label: str, linkLabel: str }),
        contact: obj({ badge: str, headingLead: str, headingHighlight: str, headingTail: str, description: str, intro: str, emailText: str, callText: str, whatsappText: str, interestLabel: str, successDescription: str, badgeOne: strs(2), badgeTwo: strs(2) }),
        detail: obj({ included: str, highlightText: str, ctaDescription: str }),
        login: obj({ badge: str, description: str }),
        register: obj({ badge: str, headingLead: str, description: str, clientLabel: str }),
      }),
    }),
  });
}
const schemaHome = () => obj({ blocks: arr(blockSchema(), 4, 8) });
const schemaDetail = () => obj({ intro: str, blocks: arr(blockSchema(), 3, 5) });
const schemaPage = () => obj({ title: str, navLabel: str, intro: str, blocks: arr(blockSchema(), 3, 5) });

export type RawSite = {
  design: { mood: string; primary: string; secondary: string; accent: string; tone: string; radius: string; headingFont: string; bodyFont: string; header: string; footer: string; menu: string; cards: string; width: string; density: string; images: string; homeOrder: string[]; sectionVariants: Record<string, string>; style?: Partial<Record<keyof StyleChoice, string>> };
  structure: { homeBlocks: any[]; extraPages: any[]; offeringPages?: any[]; nav: { label: string; target: string }[]; footerColumns: any[]; headerCta: string }; // eslint-disable-line @typescript-eslint/no-explicit-any
  pack: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- shape enforced by the JSON schema, then checked in `toPack`
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function prompt(b: WebsiteBrief, plan: WebsitePlan, knowledge = "") {
  const direction = DESIGN_DIRECTIONS[hash(b.slug + b.name) % DESIGN_DIRECTIONS.length];
  const subs = b.subCategories.map((s) => `${s.name} (${s.category})`).join("; ");
  const system = `You are a senior brand strategist, web designer and copywriter. You write the COMPLETE public website for one business, following a website-building brief that was written for it. The text must be genuinely useful production copy for that business's real customers, never placeholder text. Write all visitor-facing text in the language the brief names, using short, common words that a person with little schooling would understand.

Hard rules:
- Be truthful. You do NOT know this business's ownership, history, opening hours, delivery, prices, ingredients, materials, speed, quality, hygiene, guarantees, customisation, certifications, staff, address, phone or email. Never state or imply any of these as fact, never invent statistics, years in business, number of customers, awards, client names, testimonials or prices. Describe only WHAT the business offers (from its categories and sub-categories) and HOW a customer can get started (call, message, ask, book, order, visit), and phrase anything uncertain as an invitation to ask ("Pooch lijiye", "Ask us", "Get in touch to confirm").
- Use the vocabulary and main action given in the brief. The offerings list is the business's real offerings, named the way its customers say them; do not call them "services" unless that is the brief's word.
- Build exactly the pages the brief plans. The home page flow follows the brief's home outline. Every page's blocks must fit that page's purpose. Never add pages that are not planned. Do not write a gallery, photos or videos page; the owner adds photos later.
- Blocks: kind "services-grid" shows the business's offerings (the offerings list you write in pack.services); "features" and "checklist" are short lists (items with title and text); "why" is exactly 3 or 4 reasons; "steps" is exactly 3 or 4 steps; "faq" is items whose title is the question and text is the answer; "text" is a heading and a paragraph; "cta" is a closing call to action (heading, text, ctaLabel; items are short checklist titles). Item icons come from the allowed list and are ignored by other blocks. Every block must have at least one item; for "services-grid" and "text" blocks give one item whose title, text and icon are empty strings. Other unused fields are empty strings.
- Every page must be COMPLETE and genuinely useful the moment it is published: no placeholders, no "coming soon", no empty sections, and no page that depends on facts only the owner has. Fill each page with real, accurate, general knowledge a customer of this trade needs, written in this business's voice: how things work, what to know before choosing, how to prepare, how to look after or use what they buy, common mistakes to avoid, what to ask, what to bring or have ready, simple safe tips. Each page has 4 to 6 blocks and is long enough to feel like a real page of a real website; list blocks (features, checklist) have 5 to 8 items, each with a title and 2 to 3 plain, informative sentences; text blocks are a full paragraph of 4 to 6 sentences; a faq block has 8 to 10 questions with real, complete answers (6 on the home page). Where the answer needs a fact only the business knows (price, stock, time, place), say how to ask for it, in the same breath as giving the general part. Follow the care notes of the domain knowledge (for health and similar trades, give general information and tell visitors to ask a qualified person for advice).
- Counts: offerings (pack.services) 4 to 8; why reasons exactly 4; steps items exactly 4; faqs exactly 6; hero chips exactly 3; status and perf each exactly 2 entries; checklist exactly 3; homeBlocks follows the outline (6 to 9); extraPages are exactly the planned pages (4 to 6 blocks each); offeringPages are one detailed page for every offering (3 to 5 blocks); nav 3 to 6 entries; footerColumns 2 to 3 with 2 to 5 links each.
- Menu and footer targets must be "/", "/contact", "/privacy-policy", or "/" + the slug of one of the planned pages${plan.needsAccounts ? ', or "/login" and "/register"' : ""}. Menu labels use the customers' own words.
- Hero chips are the three main offerings as short nouns. The two "status" and two "perf" pairs are small badges: use ["What we offer", <main offerings>] and ["Ask us", <how to start>] style content with no quality or speed claims.
- Style recipes (design.style): pick ONE option for each group so this site looks clearly its own, not just a different colour: buttons (pill, soft, sharp, chunky, outline), headings (plain, tight, accent-bar, uppercase, underline), bands (how sections alternate: none, banded, hairline, framed, tinted-rows), heroDecor (none, grid, dots, stripes, glow), cardAccent (none, top-bar, left-bar, tint, corner), headerStyle (plain, accent-line, tinted, elevated, underlined), texture (plain, paper, mesh, dotgrid), links (plain, underline, highlight). Match the brief's mood: a village produce seller or a band is warm and lively, a clinic calm and clean, a law firm restrained, a creator bold. Do not choose the plain/none option for most groups.
- Design: the palette, fonts and layout options must express the brief's look and feel and the design direction; colours are hex like #1f6f5c; fonts only from the allowed list; choose layout options that suit, not generic defaults.
- The "copy" object is the wording for the contact page and the other supporting pages. The contact heading is lead + highlight + tail. ${plan.needsAccounts ? "The sign-in and sign-up pages are for the business's customers; describe a simple customer account." : "No sign-in or sign-up pages exist for this site; fill those fields with short neutral text anyway."}
- Return minified JSON on a single line.`;
  const user = `Business name: ${b.name}
Country: ${b.country || "not stated"}
Business categories: ${b.categories.join("; ") || "not stated"}
Business sub-categories (what it actually does): ${subs || "not stated"}
Design direction (for variety): ${direction}

WEBSITE-BUILDING BRIEF
${plan.sitePrompt}

Language of all visitor-facing text: ${plan.language}${plan.direction === "rtl" ? " (right-to-left)" : ""}
Country assumed: ${plan.assumedCountry}. Visitors prefer to be reached by: ${plan.preferredChannel}. Scale: ${plan.scale}; setting: ${plan.setting}; reading and technology comfort: ${plan.literacy}.
Audience: ${plan.audience}
Tone: ${plan.tone}
Look and feel: ${plan.lookAndFeel}
Offerings are called: "${plan.vocabulary.offerings}" (one: "${plan.vocabulary.offeringsOne}"). Main action button: "${plan.vocabulary.mainAction}" (${plan.primaryAction}).
Pages to build (besides home, contact and privacy): ${plan.pages.map((p) => `/${p.slug} "${p.title}" (menu: "${p.navLabel}") for: ${p.purpose}`).join(" | ")}
Home outline after the hero: ${plan.homeOutline.map((h) => `${h.kind} (${h.purpose})`).join(" > ")}

${knowledge ? `DOMAIN KNOWLEDGE for this trade (follow its NEVER-claim list, avoid its off-topic words, and respect its care notes):\n${knowledge}\n` : ""}
Write the website now.`;
  return { system, user };
}

const asStr = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
/** The first non-empty value; a gap in the AI's answer is filled from a neighbouring field, and only a truly empty set stops the build. */
const must = (v: string, what: string, ...fallbacks: string[]) => {
  const found = [v, ...fallbacks].find((x) => x && x.trim());
  if (!found) throw new Error(`The generated website is missing: ${what}`);
  return found;
};

/** Checks the model's JSON and turns it into the starter-pack shape the CMS builders understand. Throws when anything essential is missing. */
export function toPack(raw: RawSite, slug: string, images: { hero: string; about: string; services: string }, plan: WebsitePlan): { pack: StarterPack; palette: Palette; components: ThemeComponentSelections; style: StyleChoice } {
  const p = raw.pack;
  const d = raw.design;
  const known = (list: { key: string }[], v: string, fallback: string) => (keys(list).includes(v) ? v : fallback);
  const ic = (v: unknown, fallback: string) => (typeof v === "string" && ICONS.includes(v) ? v : fallback);

  const services: StarterService[] = (p.services ?? []).slice(0, 8).map((s: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    title: must(asStr(s.title, 70), "a service title"),
    subtitle: asStr(s.subtitle, 120),
    description: must(asStr(s.description, 400), "a service description"),
    icon: ic(s.icon, "Briefcase"),
    image: "",
    highlights: (s.highlights ?? []).map((h: unknown) => asStr(h, 60)).filter(Boolean).slice(0, 6),
  }));
  if (services.length < 3) throw new Error("The generated website has too few services.");
  const reasons: StarterReason[] = (p.why.reasons ?? []).map((r: any) => ({ name: asStr(r.name, 60), desc: asStr(r.desc, 220), icon: ic(r.icon, "BadgeCheck") })).filter((r: StarterReason) => r.name && r.desc);
  const steps = (items: any[]): StarterStep[] => (items ?? []).map((r) => ({ title: asStr(r.title, 60), description: asStr(r.description, 220), icon: ic(r.icon, "CheckCircle2") })).filter((r) => r.title && r.description); // eslint-disable-line @typescript-eslint/no-explicit-any
  const order = (d.homeOrder ?? []).filter((x, i, a) => (SECTION_ORDER as readonly string[]).includes(x) && a.indexOf(x) === i) as StarterPack["home"];
  for (const s of SECTION_ORDER) if (!order.includes(s)) order.push(s);

  const h = p.hero;
  const c = p.copy;
  const pack: StarterPack = {
    id: `ai-${slug}`,
    themePreset: "ai-site",
    hero: {
      badge: must(asStr(h.badge, 60), "hero badge", plan.vocabulary.offerings), line1: must(asStr(h.line1, 70), "hero headline", asStr(p.tagline, 70)), highlight: asStr(h.highlight, 60), description: must(asStr(h.description, 260), "hero description", asStr(p.tagline, 260), asStr(p.about?.intro, 260)),
      primaryCta: must(asStr(h.primaryCta, 30), "hero button", plan.vocabulary.mainAction), secondaryCta: must(asStr(h.secondaryCta, 30), "hero second button", plan.vocabulary.offerings.slice(0, 30)),
      chips: (h.chips as string[]).map((x) => asStr(x, 40)) as [string, string, string], status: (h.status as string[]).map((x) => asStr(x, 50)) as [string, string], perf: (h.perf as string[]).map((x) => asStr(x, 50)) as [string, string],
      image: images.hero,
    },
    tagline: must(asStr(p.tagline, 200), "tagline", asStr(h.description, 200)),
    footerCta: { badge: asStr(p.footerCta.badge, 40), title: must(asStr(p.footerCta?.title, 80), "footer heading", plan.vocabulary.mainAction), text: asStr(p.footerCta.text, 200), label: must(asStr(p.footerCta?.label, 30), "footer button", plan.vocabulary.mainAction) },
    servicesIntro: must(asStr(p.servicesIntro, 220), "services intro", asStr(h.description, 220)),
    servicesImage: images.services,
    services,
    why: { eyebrow: asStr(p.why.eyebrow, 40), icon: ic(p.why.icon, "BadgeCheck"), heading: must(asStr(p.why?.heading, 80), "why heading", plan.vocabulary.offerings), description: asStr(p.why.description, 220), reasons },
    steps: { eyebrow: asStr(p.steps.eyebrow, 40), icon: ic(p.steps.icon, "Route"), heading: must(asStr(p.steps?.heading, 80), "steps heading", plan.vocabulary.mainAction), accent: asStr(p.steps.accent, 60), description: asStr(p.steps.description, 220), items: steps(p.steps.items), linkLabel: asStr(p.steps.linkLabel, 30) || "Get in touch" },
    faqs: (p.faqs ?? []).map((f: any) => ({ question: asStr(f.question, 160), answer: asStr(f.answer, 500) })).filter((f: { question: string; answer: string }) => f.question && f.answer), // eslint-disable-line @typescript-eslint/no-explicit-any
    cta: { heading: must(asStr(p.cta?.heading, 80), "cta heading", plan.vocabulary.mainAction), description: asStr(p.cta.description, 220), label: must(asStr(p.cta?.label, 30), "cta button", plan.vocabulary.mainAction), checklist: (p.cta.checklist as string[]).map((x) => asStr(x, 50)).filter(Boolean) },
    about: { intro: must(asStr(p.about?.intro, 300), "about intro", asStr(p.tagline, 300), asStr(h.description, 300)), image: images.about, approachHeading: asStr(p.about.approachHeading, 80), approachDescription: asStr(p.about.approachDescription, 240), principles: steps(p.about.principles) },
    home: order,
    copy: {
      about: { ctaHeading: asStr(c.aboutCta.heading, 80), ctaDescription: asStr(c.aboutCta.description, 220), ctaLabel: asStr(c.aboutCta.label, 30), linkLabel: asStr(c.aboutCta.linkLabel, 30) },
      contact: { badge: asStr(c.contact.badge, 40), headingLead: asStr(c.contact.headingLead, 50) + " ", headingHighlight: asStr(c.contact.headingHighlight, 40), headingTail: asStr(c.contact.headingTail, 10), description: asStr(c.contact.description, 240), intro: asStr(c.contact.intro, 200), emailText: asStr(c.contact.emailText, 120), callText: asStr(c.contact.callText, 120), whatsappText: asStr(c.contact.whatsappText, 120), interestLabel: asStr(c.contact.interestLabel, 40), successDescription: asStr(c.contact.successDescription, 200), badgeOne: (c.contact.badgeOne as string[]).map((x) => asStr(x, 40)) as [string, string], badgeTwo: (c.contact.badgeTwo as string[]).map((x) => asStr(x, 40)) as [string, string] },
      detail: { included: asStr(c.detail.included, 40), highlightText: asStr(c.detail.highlightText, 160) || "{h} — taken care of by the {name} team.", ctaDescription: asStr(c.detail.ctaDescription, 200) },
      login: { badge: asStr(c.login.badge, 40), description: asStr(c.login.description, 200), features: [] },
      register: { badge: asStr(c.register.badge, 40), headingLead: asStr(c.register.headingLead, 60), description: asStr(c.register.description, 200), clientLabel: asStr(c.register.clientLabel, 30) || "Customer" },
    },
  };
  // ── The planned shape of the site ──
  const RESERVED = new Set(["contact", "privacy-policy", "login", "register", "portal", "api", "workspace", "platform", "cms"]);
  const planned = new Set(plan.pages.map((p) => p.slug));
  const cleanBlock = (b: any): StarterBlock | null => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!b || !(BLOCK_KINDS as readonly string[]).includes(b.kind)) return null;
    return {
      kind: b.kind, eyebrow: asStr(b.eyebrow, 50), heading: asStr(b.heading, 90), text: asStr(b.text, 400), ctaLabel: asStr(b.ctaLabel, 30),
      items: (Array.isArray(b.items) ? b.items : []).slice(0, 8).map((i: any) => ({ title: asStr(i?.title, 120), text: asStr(i?.text, 400), icon: ic(i?.icon, "BadgeCheck") })).filter((i: { title: string }) => i.title), // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  };
  const st = raw.structure;
  const homeBlocks = (st.homeBlocks ?? []).map(cleanBlock).filter((b: StarterBlock | null): b is StarterBlock => b !== null && blockUsable(b));
  if (homeBlocks.length < 3) throw new Error("The generated home page is too short.");
  const seenSlugs = new Set<string>();
  const extraPages = (st.extraPages ?? []).flatMap((pg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const sl = asStr(pg?.slug, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    const blocks = (Array.isArray(pg?.blocks) ? pg.blocks : []).map(cleanBlock).filter((b: StarterBlock | null): b is StarterBlock => b !== null && blockUsable(b));
    // A page with less than two blocks of real content is never published: an empty page is worse than no page.
    if (!sl || RESERVED.has(sl) || !planned.has(sl) || seenSlugs.has(sl) || !asStr(pg?.title, 80) || blocks.length < 2) return [];
    seenSlugs.add(sl);
    return [{ slug: sl, title: asStr(pg.title, 80), navLabel: asStr(pg.navLabel, 30) || asStr(pg.title, 30), intro: asStr(pg.intro, 300), blocks }];
  }).slice(0, 8);
  const seenDetail = new Set<string>();
  const offeringPages = ((st as { offeringPages?: any[] }).offeringPages ?? []).flatMap((pg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const n = pack.services.findIndex((sv, i) => offeringSlug(sv.title, i) === pg?.slug);
    const blocks = (Array.isArray(pg?.blocks) ? pg.blocks : []).map(cleanBlock).filter((b: StarterBlock | null): b is StarterBlock => b !== null && blockUsable(b));
    if (n < 0 || seenDetail.has(pg.slug) || blocks.length < 2) return [];
    seenDetail.add(pg.slug);
    return [{ slug: pg.slug as string, title: pack.services[n].title, intro: asStr(pg.intro, 300), blocks }];
  });
  pack.structure = {
    homeBlocks,
    extraPages,
    offeringBase: plan.offeringBase,
    offeringPages,
    nav: (st.nav ?? []).map((n) => ({ label: asStr(n?.label, 30), target: asStr(n?.target, 80) })).filter((n) => n.label && n.target),
    footerColumns: (st.footerColumns ?? []).map((c: any) => ({ title: asStr(c?.title, 40), links: (Array.isArray(c?.links) ? c.links : []).map((l: any) => ({ label: asStr(l?.label, 40), target: asStr(l?.target, 80) })) })), // eslint-disable-line @typescript-eslint/no-explicit-any
    headerCta: asStr(st.headerCta, 24) || plan.vocabulary.mainAction.slice(0, 24),
    mode: "plan",
    accounts: plan.needsAccounts,
  };

  if (pack.why.reasons.length < 3 || pack.steps.items.length < 3 || pack.faqs.length < 3 || pack.about.principles.length < 2) throw new Error("The generated website is incomplete.");
  if (!pack.hero.chips.every(Boolean)) throw new Error("The generated hero is incomplete.");

  const hex = (v: string, fallback: string) => (isHex(v) ? v : fallback);
  const palette: Palette = {
    primary: hex(d.primary, "#2f5d8a"), secondary: hex(d.secondary, "#3b4a63"), accent: hex(d.accent, "#c07a2c"), tone: d.tone, radius: d.radius,
    headingFont: known(FONT_OPTIONS, d.headingFont, "geist"), bodyFont: known(FONT_OPTIONS, d.bodyFont, "geist"),
  };
  // Layout choices are spread across the options by the business itself (left to itself the AI gives everyone the same few combinations);
  // the colours, fonts, roundness, buttons, hero decoration and texture carry the mood the AI chose.
  const pickKey = (list: { key: string }[], salt: string) => seededPick(keys(list), slug, salt);
  const sectionVariants: Record<string, string> = {};
  for (const [type, list] of Object.entries(SECTION_VARIANTS)) {
    const v = seededPick(keys(list), slug, `variant:${type}`);
    if (v !== "default") sectionVariants[type] = v;
  }
  const components: ThemeComponentSelections = {
    sections: sectionVariants,
    header: pickKey(HEADER_VARIANTS, "header"), footer: pickKey(FOOTER_VARIANTS, "footer"), menu: pickKey(MENU_VARIANTS, "menu"),
    cards: pickKey(CARD_VARIANTS, "cards"), width: pickKey(WIDTH_VARIANTS, "width"), density: pickKey(DENSITY_VARIANTS, "density"), images: pickKey(IMAGE_VARIANTS, "images"),
  };
  return { pack, palette, components, style: resolveStyle(d.style, slug) };
}

/** One structured-output call with stall detection and retries (cooler each time, then a smaller model). Returns the parsed JSON. */
async function callJson<T>(client: OpenAI, system: string, user: string, schemaObj: unknown, name: string, maxTokens: number): Promise<T> {
  const primary = WEBSITE_MODEL();
  const attempts = [{ model: primary, temperature: 0.7 }, { model: primary, temperature: 0.5 }, { model: process.env.WEBSITE_AI_FALLBACK_MODEL || "gpt-4.1-mini", temperature: 0.4 }];
  let lastError = "The AI returned nothing.";
  for (const a of attempts) {
    try {
      const stream = await client.chat.completions.create({
        model: a.model,
        temperature: a.temperature,
        max_completion_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
        response_format: { type: "json_schema", json_schema: { name, strict: true, schema: schemaObj as Record<string, unknown> } },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      });
      let text = "";
      let stalled = false;
      let usage: OpenAI.CompletionUsage | null | undefined;
      for await (const chunk of stream) {
        if (chunk.usage) usage = chunk.usage;
        text += chunk.choices[0]?.delta?.content ?? "";
        // The model now and then writes blank space forever instead of closing the JSON; stop waiting for the token limit.
        if (text.length > 200 && /\s{60}$/.test(text)) { stalled = true; break; }
      }
      if (stalled) { stream.controller.abort(); lastError = "The AI stalled while writing the website."; continue; }
      return JSON.parse(text) as T;
    } catch (err) {
      // The AI allowance being used up is not a model hiccup: retrying (or a smaller model) would only fail the same way.
      if (isBillingLimitError(err)) throw err;
      lastError = err instanceof Error ? err.message : lastError;
    }
  }
  throw new Error(lastError);
}

type Block = Record<string, unknown>;
type PageDraft = { title: string; navLabel: string; intro: string; blocks: Block[] };
type DetailDraft = { intro: string; blocks: Block[] };
export interface FixIssue { path: string; text: string; reason: string }

/** Runs the tasks `size` at a time (keeps many parallel AI calls inside the account's rate limits). */
async function pool<T>(tasks: (() => Promise<T>)[], size: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, async () => {
    while (next < tasks.length) {
      const i = next++;
      out[i] = await tasks[i]();
    }
  }));
  return out;
}

/**
 * Writes the website in many SMALL calls instead of one huge one (huge outputs make the model stall and are slow):
 *  - the core: look, menu, footer and the shared copy (hero, offerings, FAQ, about, contact wording…);
 *  - the home page blocks;
 *  - one call per planned page;
 *  - one call per offering, for its own detailed page (these need the offerings written by the core, so they follow it).
 * With `fix`, only the parts that have problems are written again (told exactly what was wrong); the rest is kept as it was.
 */
export async function writeWebsite(brief: WebsiteBrief, plan: WebsitePlan, knowledge = "", fix?: { raw: RawSite; issues: FixIssue[] }): Promise<RawSite> {
  const client = await platformClient();
  const base = prompt(brief, plan, knowledge);
  const task = (what: string, issues?: FixIssue[], draft?: unknown) =>
    `${base.user}\n\nYOUR TASK NOW: ${what}${draft && issues?.length ? `\n\nA first draft of this part exists:\n${JSON.stringify(draft)}\n\nIt has problems. Rewrite it completely, fixing ONLY these (keep everything else good):\n${issues.map((i, n) => `${n + 1}. ${i.path}: ${i.reason} — "${i.text.slice(0, 140)}"`).join("\n")}` : ""}`;
  const oldPages = (fix?.raw.structure.extraPages ?? []) as { slug: string; title: string; navLabel: string; intro: string; blocks: Block[] }[];
  const oldDetails = (fix?.raw.structure.offeringPages ?? []) as { slug: string; title: string; intro: string; blocks: Block[] }[];
  const partOf = (path: string): string => {
    const page = path.match(/^structure\.extraPages\[(\d+)\]/);
    if (page) return `page:${oldPages[Number(page[1])]?.slug ?? ""}`;
    const detail = path.match(/^structure\.offeringPages\[(\d+)\]/);
    if (detail) return `detail:${oldDetails[Number(detail[1])]?.slug ?? ""}`;
    if (path.startsWith("structure.homeBlocks")) return "home";
    return "core";
  };
  const issuesFor = (part: string) => (fix ? fix.issues.filter((i) => partOf(i.path) === part) : []);
  const redo = (part: string, exists: boolean) => !fix || issuesFor(part).length > 0 || !exists;

  const coreTask = async () =>
    redo("core", true)
      ? callJson<Pick<RawSite, "design" | "pack"> & { structure: { nav: RawSite["structure"]["nav"]; footerColumns: unknown[]; headerCta: string } }>(
          client, base.system,
          task("Write ONLY the site-wide parts: design, structure (nav, footerColumns, headerCta; do not write home blocks or pages here) and pack (hero, tagline, footerCta, servicesIntro, services, why, steps, faqs, cta, about, copy). Nothing in this answer is a page: pages are written separately.", issuesFor("core"), fix ? { design: fix.raw.design, structure: { nav: fix.raw.structure.nav, footerColumns: fix.raw.structure.footerColumns, headerCta: fix.raw.structure.headerCta }, pack: fix.raw.pack } : undefined),
          schemaCore(), "core", 9000)
      : { design: fix!.raw.design, pack: fix!.raw.pack, structure: { nav: fix!.raw.structure.nav, footerColumns: fix!.raw.structure.footerColumns, headerCta: fix!.raw.structure.headerCta } };

  const homeTask = async () =>
    redo("home", true)
      ? callJson<{ blocks: Block[] }>(
          client, base.system,
          task("Write ONLY the blocks of the home page that come after the hero, following the home outline above, in that order. Make each block complete and specific to this business. Do not repeat the offerings list word for word; the services-grid block only needs its heading and eyebrow.", issuesFor("home"), fix ? { blocks: fix.raw.structure.homeBlocks } : undefined),
          schemaHome(), "home", 9000)
      : { blocks: fix!.raw.structure.homeBlocks as Block[] };

  const pageTasks = plan.pages.map((pg) => async () => {
    const part = `page:${pg.slug}`;
    const old = oldPages.find((p) => p.slug === pg.slug);
    if (!redo(part, !!old)) return { ...old!, slug: pg.slug };
    const d = await callJson<PageDraft>(
      client, base.system,
      task(`Write ONLY this one page: /${pg.slug} "${pg.title}" (menu label "${pg.navLabel}"). Its purpose: ${pg.purpose}. Give it a title, a menu label, a one-or-two sentence intro, and 4 to 6 complete, substantial blocks of real, useful content for this page alone (do not repeat the home page or the other pages). The page must be fully useful on its own and long enough to feel like a real page.`, issuesFor(part), old ? { title: old.title, navLabel: old.navLabel, intro: old.intro, blocks: old.blocks } : undefined),
      schemaPage(), "page", 9000);
    return { slug: pg.slug, ...d };
  });

  // The core, the home page and the planned pages are independent of each other.
  const [c, h, ...extra] = await pool<unknown>([coreTask, homeTask, ...pageTasks], 6) as [Awaited<ReturnType<typeof coreTask>>, { blocks: Block[] }, ...{ slug: string; title: string; navLabel: string; intro: string; blocks: Block[] }[]];

  // One detailed page per offering.
  const offerings = (c.pack?.services ?? []) as { title?: string; subtitle?: string; description?: string; highlights?: string[] }[];
  const detailTasks = offerings.slice(0, 8).map((sv, n) => async () => {
    const slug = offeringSlug(String(sv.title ?? ""), n);
    const part = `detail:${slug}`;
    const old = oldDetails.find((p) => p.slug === slug);
    if (!redo(part, !!old)) return { slug, title: old!.title, intro: old!.intro, blocks: old!.blocks };
    const d = await callJson<DetailDraft>(
      client, base.system,
      task(`Write ONLY the detailed page for this one offering: "${sv.title}" (${sv.subtitle ?? ""}; ${sv.description ?? ""}). Give a one-or-two sentence intro and 3 to 5 complete blocks that tell a visitor everything useful about THIS offering: what it is, who it is for, what to know before choosing it, how it works or how to get it, how to prepare or look after it, common mistakes, and its own questions and answers. General, accurate knowledge only; never prices, stock, times or any fact about this specific business (invite the visitor to ask for those).`, issuesFor(part), old ? { intro: old.intro, blocks: old.blocks } : undefined),
      schemaDetail(), "detail", 8000);
    return { slug, title: String(sv.title ?? ""), ...d };
  });
  const details = await pool(detailTasks, 6);

  return { design: c.design, pack: c.pack, structure: { ...c.structure, homeBlocks: h.blocks, extraPages: extra, offeringPages: details } } as unknown as RawSite;
}

/** What the three photos show, written from the business itself (so they can be made while the website text is being written). */
export function imagePrompts(b: WebsiteBrief): { hero: string; about: string; services: string } {
  const what = b.subCategories.slice(0, 3).map((s) => s.name).join(", ") || b.categories.slice(0, 2).join(", ");
  const kind = b.categories[0] || what;
  return {
    hero: `A bright, welcoming photograph of the everyday setting of a ${kind} business (${what}), shot wide, with the products, tools or workplace that belong to it, no people facing the camera`,
    about: `People at work in a ${kind} business, candid and natural, seen from a respectful distance or from behind, doing ordinary work related to ${what}`,
    services: `A tidy close-up arrangement of the main things a ${kind} business offers (${what}), editorial still-life style`,
  };
}

/** Photos for the hero, about and services banners. Each is best effort: a failed image leaves that slot empty (the sections handle that), never the whole site. */
export async function makeImages(prompts: { hero: string; about: string; services: string }, store: (png: Buffer, name: string) => Promise<string>): Promise<{ hero: string; about: string; services: string }> {
  let client: OpenAI;
  try {
    client = await platformClient();
  } catch {
    return { hero: "", about: "", services: "" };
  }
  const one = async (text: string, name: string): Promise<string> => {
    try {
      const r = await client.images.generate({ model: IMAGE_MODEL(), prompt: `${text}. Photorealistic editorial photograph, natural light, no text, no logos, no watermark.`, size: "1536x1024", quality: "low", n: 1 });
      const b64 = r.data?.[0]?.b64_json;
      return b64 ? await store(Buffer.from(b64, "base64"), name) : "";
    } catch (err) {
      console.error(`[ai-website] image "${name}" failed`, err instanceof Error ? err.message : err);
      return "";
    }
  };
  const [hero, about, services] = await Promise.all([one(prompts.hero, "hero"), one(prompts.about, "about"), one(prompts.services, "services")]);
  return { hero, about, services };
}

export const newUploadName = () => `${randomUUID()}.png`;
