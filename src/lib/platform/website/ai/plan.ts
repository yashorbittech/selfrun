import "server-only";
import { getOpenAI } from "@/lib/openai";
import OpenAI from "openai";
import { BLOCK_KINDS } from "@/lib/platform/website/starter-packs";
import type { WebsiteBrief } from "@/lib/platform/website/ai/generate";

/**
 * Step one of building a website: think about THIS business, and the people who will use its site, before any page is written.
 *
 * The platform is used by everyone: people who read well and people who barely read, villagers and city people, traditional and very
 * modern businesses, tiny street traders and large enterprises, schools, hospitals, charities and government offices, in every country
 * and language. So nothing here is a fixed template. From the business's categories and sub-categories (plus anything we know about where
 * the owner is) the planner decides who the visitors are and how they prefer to reach a business, which language and script to write in,
 * which pages exist and what they are called, how the home page flows, what the site should feel like, and writes the full "website
 * building prompt" the second step follows. It is stated openly (in `assumptions`) whenever it had to guess.
 *
 * Planning can never fail the whole website: if the AI cannot produce a valid plan after several tries (and a smaller model), a sensible
 * plan is built from the categories alone (`fallbackPlan`).
 */

export const ACTIONS = ["call", "whatsapp", "book", "order", "visit", "enquire"] as const;
const PURPOSES = ["sell", "book", "showcase", "inform", "portfolio", "community"] as const;
const SCALES = ["individual", "micro", "small", "medium", "large", "enterprise", "institution", "nonprofit", "government", "creator", "student"] as const;
const SETTINGS = ["village", "town", "city", "online", "regional", "global"] as const;
const LITERACY = ["low", "mixed", "high", "professional"] as const;

export interface WebsitePlan {
  /** Where this plan came from: the AI, or the built-in fallback. */
  source: "ai" | "fallback";
  audience: string;
  scale: (typeof SCALES)[number];
  setting: (typeof SETTINGS)[number];
  /** How comfortable the visitors are with reading and with technology. */
  literacy: (typeof LITERACY)[number];
  purpose: (typeof PURPOSES)[number];
  /** The language (and script) all visitor-facing text is written in, e.g. "Hinglish (Hindi in English letters)", "Spanish", "Arabic". */
  language: string;
  direction: "ltr" | "rtl";
  /** The country the plan assumed, and how visitors there prefer to contact a business ("WhatsApp", "LINE", "phone call", "email"). */
  assumedCountry: string;
  preferredChannel: string;
  tone: string;
  lookAndFeel: string;
  vocabulary: { offerings: string; offeringsOne: string; mainAction: string };
  primaryAction: (typeof ACTIONS)[number];
  needsAccounts: boolean;
  pages: { slug: string; title: string; navLabel: string; purpose: string }[];
  /** The URL word for the page of each single offering ("treatments" -> /treatments/<offering>). */
  offeringBase: string;
  homeOutline: { kind: (typeof BLOCK_KINDS)[number]; purpose: string }[];
  /** What the planner had to guess (shown to the owner so they can correct the prompt). */
  assumptions: string[];
  /** The complete brief the website is written from. Shown in CMS → AI Website. */
  sitePrompt: string;
}

const str = { type: "string" } as const;
const en = (v: readonly string[]) => ({ type: "string", enum: [...v] }) as const;
const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false }) as const;
const list = (items: unknown) => ({ type: "array", items }) as const;

const SCHEMA = obj({
  audience: str,
  scale: en(SCALES),
  setting: en(SETTINGS),
  literacy: en(LITERACY),
  purpose: en(PURPOSES),
  language: str,
  direction: en(["ltr", "rtl"]),
  assumedCountry: str,
  preferredChannel: str,
  tone: str,
  lookAndFeel: str,
  vocabulary: obj({ offerings: str, offeringsOne: str, mainAction: str }),
  primaryAction: en(ACTIONS),
  needsAccounts: { type: "boolean" },
  pages: list(obj({ slug: str, title: str, navLabel: str, purpose: str })),
  offeringBase: str,
  homeOutline: list(obj({ kind: en(BLOCK_KINDS), purpose: str })),
  assumptions: list(str),
  sitePrompt: str,
});

const SYSTEM = `You are a product designer, local-market researcher and strategist who plans websites for every kind of person who runs a business or has something to show, anywhere in the world. You never use one template. You think about the real person behind this business, who their customers are, where they live, how they read, and how they prefer to reach a business, then plan the site that fits THEM.

WHO USES THIS PLATFORM (all of these, and everything between): people who read and write well and people who barely read; village and farming communities, small-town and big-city people; traditional "desi" local trades and very modern businesses; people with only a basic phone and people who are highly technical; highly educated professionals; street vendors, shopkeepers, artisans, performers, service providers, students, creators, freelancers, small companies, large enterprises, schools and colleges, clinics and hospitals, charities, religious and community groups, government offices; in every country and language.

Decide, using the categories and sub-categories first, then the country and language hints, then the business name:

1. scale: individual | micro (street or home trader) | small | medium | large | enterprise | institution (school, college, hospital, clinic) | nonprofit | government | creator (artist, performer, influencer) | student.
2. setting: village | town | city | online | regional | global. literacy: how comfortable the visitors are with reading and technology: low (prefer pictures, very short words, a phone call or voice message), mixed, high, professional.
3. assumedCountry and language. Hints may include a country code, the browser's language list and the time zone; they are clues, not proof. Use them together with the business name and categories. If nothing indicates the place, assume the most likely market for the business and SAY SO in assumptions. Language: write in the language the business's own customers actually use, in the script they actually read. Examples: for small local trades in India with everyday customers "Hinglish (Hindi in English letters)" or "Hindi (Devanagari)", or the regional language (Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia, Urdu...); Spanish in Latin America and Spain, Portuguese in Brazil and Portugal, Arabic (set direction rtl) in the Arab world, Urdu or Persian (rtl), Swahili or English in East Africa, French in francophone Africa, Indonesian, Filipino/Taglish, Vietnamese, Thai, Turkish, Russian, German, Japanese, Korean, Chinese, and so on. Use "English (simple)" for professionals, students, institutions, companies, international audiences, or when unsure. Give the language as its English name with the variant or script in brackets when useful, for example "Spanish (Mexico)", "Japanese", "Arabic", "Hindi (Devanagari)", "English (Nigeria)"; never a language code. Never choose a language you cannot write correctly. Set direction "rtl" only for right-to-left languages.
4. preferredChannel: how people in that country and trade prefer to contact a business (WhatsApp is dominant in India, Brazil, Mexico, Argentina, Indonesia, Nigeria, South Africa, Egypt and much of the Gulf; LINE in Japan, Thailand and Taiwan; KakaoTalk in Korea; Zalo in Vietnam; Telegram in parts of Russia and Ukraine; WeChat in China; phone call for many trades; email or contact form for professionals and enterprises). Use it in the wording of the main action.
5. purpose and primaryAction: what a visitor should do first (call, whatsapp, book, order, visit, enquire); pick the nearest of these for a channel the site cannot link directly.
6. vocabulary: what THIS business calls its offerings in the site's language, the singular form, and the main button wording.
7. pages: ONLY the pages this business genuinely needs besides the home page (the contact page and a privacy page are added automatically, so never list them). 5 to 8 pages (a rich site, not a thin one: cover everything a visitor of this trade would want to read before getting in touch, split into focused pages: what is offered, how it works, how to choose or prepare, how to look after or use what they get, safety and care, common questions, offers or packages in words). Patterns, to be adapted and never copied blindly: a vegetable or fruit seller: what is fresh, how to order, offers; a band, orchestra or wedding performer: what we play or perform, packages, how to book; a dancer or teacher: shows or classes, how to book; a beauty parlour or salon: treatments, offers, how to book; a student or freelancer: about me, projects or work, skills; a shop: products, offers, how to order, find us; a repair, trade or home-service worker: what I fix or make, how it works, areas I serve (only if given); a farm or farmer: what we grow, how to buy; a restaurant or tiffin or sweet shop: menu or what we make, how to order; a school or college: about, programs, admissions, student life; a clinic or hospital: departments or treatments, how to book, visiting information; a professional (lawyer, accountant, consultant): practice areas, how it works, about; a charity or community group: our work, how to help, get involved; a government office: services offered, how to apply, who to contact; an enterprise or large company: what we do, solutions or industries, about the company, careers, newsroom-style updates only if they fit, investor information only for listed companies; an online-only seller: products, how to order, delivery information only if given; a creator or influencer: about, what I make, collaborate; a farmer cooperative or self-help group: our members' products, how to buy, about the group. Use "services", "about", "products" or "offers" only when they fit, in the words the customers say. Never plan a gallery, photo or video page (the owner adds photos later). slug is lowercase kebab-case in plain ASCII letters even if the title is in another script.
8. offeringBase: one short lowercase ASCII word that is the URL home of the single-offering pages (every offering also gets its own detailed page), in the words customers use ("sabziyan", "packages", "treatments", "services", "products", "classes", "rooms", "menu").
8b. homeOutline: 6 to 9 blocks after the hero, in the best order for this business. kind is one of: ${BLOCK_KINDS.join(", ")}. Low-literacy and village audiences: short words and short sentences, but still plenty of useful content; steps and lists over long paragraphs; professional and enterprise audiences: more structured and formal.
9. needsAccounts: true only if customers realistically need to sign in (a membership, classes with a portal, a learning product, a customer portal for a larger business). Street traders, performers, parlours, shops and most small businesses: false.
10. lookAndFeel: art direction in two or three sentences: mood, named colours, type feel (large and friendly for low-literacy audiences; refined for professionals; bold for performers; calm for clinics and schools), density (airy or busy), imagery style. It must clearly differ between a vegetable seller, a band, a dancer, a beauty parlour, a student, a hospital, a law firm and a large enterprise, and fit the local culture (festive colours where appropriate, restraint where appropriate).
11. tone: how the text should sound (warm and chatty, respectful and plain, formal and precise...).
12. assumptions: 2 to 6 short sentences stating what you had to guess (country, language, scale, anything the categories did not settle). The owner will read these.
13. sitePrompt: the complete website-building brief (200 to 350 words, plain prose in English) that another writer could follow to build this exact site: who it is for and how they read, the goal, the language and script, the pages and what each is for, the home page flow, the words to use, the main action and where it appears, the look and feel, and what must NOT be claimed. Never invent facts about the business (prices, hours, address, years in business, customers, awards, certifications, sizes, accreditations); where a detail is unknown the site invites the visitor to ask.

If the categories are unusual, custom-typed or broad, use the plain meaning of the words and plan a sensible general site for that kind of work. Several categories: build around the main one and mention the rest, do not list everything. Return minified JSON on a single line.`;

async function client(): Promise<OpenAI> {
  // The company's metered client: planning the site counts against its AI-token allowance like everything else.
  return getOpenAI({ timeoutMs: 90_000, maxRetries: 1 });
}

const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
const NEEDS_OWNER_FACTS = /\b(team|staff|doctors?|founder|story|history|gallery|photos?|videos?|testimonials?|reviews?|awards?|clients?|branches|locations?|timings?|hours|prices?|pricing|careers?|jobs?|news|find[- ]us|visit[- ]us|directions|address|map|how[- ]to[- ](reach|find|get[- ]here)|where[- ]we)\b|\bour (story|team|clients|doctors)\b/i;
const RESERVED = new Set(["contact", "privacy-policy", "login", "register", "portal", "api", "workspace", "platform", "cms"]);

/** Cleans whatever the AI returned into a valid plan, filling gaps with safe defaults. Returns null only when it is unusable. */
function repair(raw: Partial<WebsitePlan> | null | undefined, b: WebsiteBrief, ownerMode = false): WebsitePlan | null {
  if (!raw || typeof raw !== "object") return null;
  const seen = new Set<string>();
  const pages = (Array.isArray(raw.pages) ? raw.pages : []).flatMap((p) => {
    const slug = s(p?.slug, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    const title = s(p?.title, 80);
    if (!slug || !title || RESERVED.has(slug) || seen.has(slug) || (!ownerMode && NEEDS_OWNER_FACTS.test(`${slug} ${s(p?.title, 80)}`))) return [];
    seen.add(slug);
    return [{ slug, title, navLabel: s(p?.navLabel, 30) || title.slice(0, 30), purpose: s(p?.purpose, 240) || title }];
  }).slice(0, 8);
  const homeOutline = (Array.isArray(raw.homeOutline) ? raw.homeOutline : []).filter((h) => (BLOCK_KINDS as readonly string[]).includes(h?.kind)).slice(0, 9).map((h) => ({ kind: h.kind, purpose: s(h.purpose, 200) }));
  const offeringBase = s(raw.offeringBase, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "offerings";
  if (pages.length < 1 || homeOutline.length < 3 || s(raw.sitePrompt, 5000).length < 150) return null;
  const language = s(raw.language, 60) || "English (simple)";
  return {
    source: "ai",
    audience: s(raw.audience, 400) || `People looking for ${b.categories[0] ?? "this kind of business"}.`,
    scale: pick(raw.scale, SCALES, "small"), setting: pick(raw.setting, SETTINGS, "town"), literacy: pick(raw.literacy, LITERACY, "mixed"),
    purpose: pick(raw.purpose, PURPOSES, "inform"),
    language,
    direction: raw.direction === "rtl" ? "rtl" : "ltr",
    assumedCountry: s(raw.assumedCountry, 60) || b.country || "not known",
    preferredChannel: s(raw.preferredChannel, 40) || "phone call",
    tone: s(raw.tone, 200) || "plain and friendly",
    lookAndFeel: s(raw.lookAndFeel, 600) || "Clean and friendly, with one confident brand colour and plenty of space.",
    vocabulary: { offerings: s(raw.vocabulary?.offerings, 40) || "What we offer", offeringsOne: s(raw.vocabulary?.offeringsOne, 40) || "Offering", mainAction: s(raw.vocabulary?.mainAction, 30) || "Contact us" },
    primaryAction: pick(raw.primaryAction, ACTIONS, "enquire"),
    needsAccounts: raw.needsAccounts === true, pages, offeringBase: RESERVED.has(offeringBase) || seen.has(offeringBase) ? `${offeringBase}-list` : offeringBase, homeOutline,
    assumptions: (Array.isArray(raw.assumptions) ? raw.assumptions : []).map((a) => s(a, 220)).filter(Boolean).slice(0, 6),
    sitePrompt: s(raw.sitePrompt, 5000),
  };
}

/** A sensible plan from the categories alone, used only when the AI could not produce one. Plain, safe and honest. */
export function fallbackPlan(b: WebsiteBrief): WebsitePlan {
  const main = b.categories[0] ?? b.subCategories[0]?.name ?? "this business";
  const offers = (b.subCategories.length ? b.subCategories.map((x) => x.name) : b.categories).slice(0, 4).join(", ");
  const hindi = /^hi\b|^hi-/i.test((b.hints?.languages ?? "").trim()) || b.hints?.country === "IN" && /^hi/i.test(b.hints?.languages ?? "");
  const language = hindi ? "Hinglish (Hindi in English letters)" : "English (simple)";
  return {
    source: "fallback",
    audience: `People who need ${main.toLowerCase()} and want a simple way to find out what is offered and get in touch.`,
    scale: "small", setting: "town", literacy: "mixed", purpose: "inform", language, direction: "ltr",
    assumedCountry: b.hints?.country || b.country || "not known", preferredChannel: "phone call or message",
    tone: "plain, short and friendly",
    lookAndFeel: "Clean and friendly with one confident brand colour, large readable text, plenty of space and simple icons.",
    vocabulary: { offerings: hindi ? "Hamari sevayein" : "What we offer", offeringsOne: hindi ? "Seva" : "Offering", mainAction: hindi ? "Humse sampark karein" : "Contact us" },
    primaryAction: "enquire", needsAccounts: false,
    offeringBase: "offerings",
    pages: [
      { slug: "what-we-offer", title: hindi ? "Hum kya karte hain" : "What we offer", navLabel: hindi ? "Hamari sevayein" : "What we offer", purpose: `List what ${b.name} offers (${offers}).` },
      { slug: "how-it-works", title: hindi ? "Kaise kaam hota hai" : "How it works", navLabel: hindi ? "Kaise" : "How it works", purpose: "Explain how to get started in a few simple steps." },
    ],
    homeOutline: [
      { kind: "services-grid", purpose: "Show the main offerings." },
      { kind: "features", purpose: "Short points about what to expect, without claims." },
      { kind: "steps", purpose: "How to get started." },
      { kind: "faq", purpose: "Common questions, answered by inviting the visitor to ask." },
      { kind: "cta", purpose: "Invite the visitor to get in touch." },
    ],
    assumptions: ["The AI could not plan this site, so a simple plan was built from your categories.", `Language assumed: ${language}.`],
    sitePrompt: `This website is for ${b.name}, a ${main.toLowerCase()} business that offers ${offers || "its products and services"}. Visitors are people who need this kind of work and want a clear, quick way to see what is offered and to get in touch. Write all text in ${language} using short, familiar words. The home page opens with a clear headline that says what the business does, then shows the main offerings, a few short points about what to expect, simple steps to get started, a few common questions answered by inviting the visitor to ask, and a closing invitation to get in touch. The site has two supporting pages: one listing what the business offers and one explaining how to get started, plus the contact and privacy pages. The main action is to get in touch. The look is clean and friendly, with one confident brand colour, large readable text and plenty of space. Do not invent any facts: no prices, hours, address, years in business, customers, awards or guarantees. Wherever a detail is unknown, invite the visitor to ask.`,
  };
}

export async function planWebsite(b: WebsiteBrief, knowledge = "", ownerPrompt = ""): Promise<WebsitePlan> {
  // No OpenAI key at all: this throws, and the caller reports it (the website cannot be written without AI).
  const c = await client();
  const hints = b.hints ?? {};
  const user = `Business name: ${b.name}
Business categories: ${b.categories.join("; ") || "not stated"}
Business sub-categories (what it actually does): ${b.subCategories.map((x) => `${x.name} (${x.category})`).join("; ") || "not stated"}
Country (stated by the owner): ${b.country || "not stated"}
Hints from the sign-up request (clues only): country code ${hints.country || "unknown"}; browser languages ${hints.languages || "unknown"}; time zone ${hints.timezone || "unknown"}

${knowledge ? `\nDOMAIN KNOWLEDGE for the chosen categories (researched; follow it unless the sub-categories clearly say otherwise):\n${knowledge}\n` : ""}${ownerPrompt ? `\nTHE OWNER\u2019S OWN INSTRUCTIONS FOR THEIR WEBSITE (highest priority: follow them exactly, including the language, the pages they ask for and their names, the look and the tone, even where they differ from your usual choices; only never invent facts about the business). Turn them into the plan; the sitePrompt you write must contain their instructions in full:\n"""${ownerPrompt.slice(0, 4000)}"""\n` : ""}
Plan its website. Return minified JSON on a single line.`;
  const primary = process.env.WEBSITE_AI_MODEL || "gpt-4.1";
  const attempts: { model: string; temperature: number }[] = [
    { model: primary, temperature: 0.8 },
    { model: primary, temperature: 0.5 },
    { model: process.env.WEBSITE_AI_FALLBACK_MODEL || "gpt-4.1-mini", temperature: 0.4 },
  ];
  for (const a of attempts) {
    try {
      const res = await c.chat.completions.create({
        model: a.model,
        temperature: a.temperature,
        max_completion_tokens: 5000,
        response_format: { type: "json_schema", json_schema: { name: "plan", strict: true, schema: SCHEMA as unknown as Record<string, unknown> } },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
      });
      const plan = repair(JSON.parse(res.choices[0]?.message?.content ?? "null"), b, !!ownerPrompt);
      if (plan) return plan;
    } catch (err) {
      console.error("[ai-website] plan attempt failed", a.model, err instanceof Error ? err.message : err);
    }
  }
  console.error("[ai-website] planning failed; using the built-in plan for", b.name);
  return fallbackPlan(b);
}
