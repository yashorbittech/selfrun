import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Bot, BookOpen, Check, GraduationCap, Layers, Map as MapIcon, Plug, ShieldCheck, Sparkles, Users, Wallet, Zap } from "lucide-react";
import { getFeatureGroups, getFeatureModules } from "@/lib/platform/saas/modules";
import { FEATURE_LISTS, PANEL_VALUE, featureCount, featuresOf } from "@/lib/platform/saas/feature-lists";
import { PANEL_DETAIL } from "@/lib/platform/saas/panel-detail";
import { EXTRA_SCREENS } from "@/lib/platform/saas/site";
import { screenFor } from "@/lib/platform/saas/screens";
import { CtaBand, HeroCtas, PageHero } from "@/components/platform/saas/blocks";
import ProductLogo from "@/components/products/ProductLogo";
import Reveal from "@/components/platform/saas/Reveal";
import DeviceScene from "@/components/platform/saas/DeviceScene";
import { productDocsPath, productKeyFromSlug, productPath, productSlugFor } from "@/lib/platform/saas/product-routes";
import { productShort } from "@/lib/platform/saas/product-short";
import { pageMeta } from "@/lib/platform/saas/seo-meta";
import { PRODUCT_AUDIENCE, PRODUCT_CATEGORY, PRODUCT_SEO } from "@/lib/platform/saas/product-seo";
import JsonLd from "@/components/platform/saas/JsonLd";
import { breadcrumbList, faqPage, howTo, softwareApplication, webPage } from "@/lib/platform/saas/jsonld";
import { PRODUCT_START } from "@/lib/platform/saas/product-start";
import { productFaqs } from "@/lib/platform/saas/product-faq";
import { DOCS } from "@/lib/platform/saas/docs";
import { TUTORIALS } from "@/lib/platform/saas/tutorials";
import ProductSidebar from "@/components/platform/saas/ProductSidebar";
import ProductFaqList from "@/components/platform/saas/ProductFaq";
import ProductScrollNav from "@/components/platform/saas/product/ProductScrollNav";
import CountUp from "@/components/platform/saas/product/CountUp";
import FeatureExplorer from "@/components/platform/saas/product/FeatureExplorer";
import StepperHowItWorks from "@/components/platform/saas/product/StepperHowItWorks";
import RoleExplorer from "@/components/platform/saas/product/RoleExplorer";
import AskAiDemo from "@/components/platform/saas/product/AskAiDemo";
import ScrollToTop from "@/components/platform/saas/product/ScrollToTop";
import ScreenGallery from "@/components/platform/saas/product/ScreenGallery";
import ExtrasTabs from "@/components/platform/saas/product/ExtrasTabs";

export const dynamic = "force-dynamic";

async function load(key: string) {
  const productKey = productKeyFromSlug(key);
  if (!productKey) return null;
  const all = await getFeatureModules();
  const i = all.findIndex((m) => m.key === productKey);
  return i < 0 ? null : { m: all[i], all, prev: all[(i + all.length - 1) % all.length], next: all[(i + 1) % all.length] };
}

export async function generateProductMetadata(key: string): Promise<Metadata> {
  const d = await load(key);
  if (!d) return {};
  const { m } = d;
  const seo = PRODUCT_SEO[m.key];
  const value = PANEL_VALUE[m.key];
  const bare = m.name.replace(/^SelfRun\s+/i, "");
  return pageMeta({
    path: productPath(m.key),
    title: seo?.title ?? `${bare}: ${m.headline}`,
    description: `${m.name}: ${m.headline}. ${m.summary}${value ? ` Replaces ${value.replaces}.` : ""} Free to start.`,
    keywords: [m.name, bare, `${m.name} features`, `${bare} free`, `${bare} software`, ...(seo?.keywords ?? [])],
    tag: "Product",
  });
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "why", label: "Why use it" },
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "who", label: "Who uses it" },
  { id: "extras", label: "Automations & AI" },
  { id: "screens", label: "Screens" },
  { id: "walkthroughs", label: "Walkthroughs" },
  { id: "docs", label: "Docs" },
  { id: "faq", label: "Questions" },
];

/** Lower-cases the first letter of a phrase unless it starts an acronym (HR, CRM, SOP…). */
const soft = (t: string) => (/^[A-Z][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);

/** The overview's lead-in (no number, no frame). */
function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-36 pb-12 lg:pb-14">{children}</section>;
}

/**
 * One numbered chapter of the page: a node on the rail down the left (so the order is always visible), a framed panel with the chapter's
 * number, name and a one-line promise, and a link to the next chapter at the bottom. Alternating tints keep neighbours apart.
 */
function Chapter({ id, n, total, label, title, lead, next, tint, children }: { id: string; n: string; total: number; label: string; title: React.ReactNode; lead?: React.ReactNode; next?: { id: string; label: string }; tint: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="relative scroll-mt-36 pb-10 lg:pb-12">
      <span className="absolute -left-[64px] top-7 hidden h-11 w-11 items-center justify-center rounded-full border-4 border-background bg-gradient-to-br from-primary to-brand-accent text-sm font-black text-white shadow-lg shadow-primary/30 lg:flex" aria-hidden>{n}</span>
      <div className={`overflow-hidden rounded-[2rem] border shadow-sm ${tint ? "border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.07]" : "border-border/60 bg-card"}`}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-muted/30 px-6 py-3.5 sm:px-10">
          <p className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary"><span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-black tracking-normal text-primary-foreground lg:hidden">{n}</span>Chapter {Number(n)} of {total}<span className="hidden text-muted-foreground sm:inline">· {label}</span></p>
          <div className="flex items-center gap-1.5" aria-hidden>{Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === Number(n) ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />)}</div>
        </header>
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl">{title}</h2>
            {lead && <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{lead}</p>}
          </div>
          {children}
        </div>
        {next && (
          <a href={`#${next.id}`} className="group flex items-center justify-between gap-3 border-t border-border/50 bg-muted/30 px-6 py-3.5 text-sm font-bold transition-colors hover:bg-primary/[0.07] sm:px-10">
            <span className="text-muted-foreground">Next chapter</span><span className="inline-flex items-center gap-2 text-primary">{next.label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </a>
        )}
      </div>
    </section>
  );
}

const tile = "group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10";

export default async function ProductDetailPage({ productSlug }: { productSlug: string }) {
  const key = productSlug;
  const d = await load(key);
  if (!d) notFound();
  const { m, all, prev, next } = d;
  if (key !== productSlugFor(m.key)) permanentRedirect(productPath(m.key));
  const sidebarGroups = (await getFeatureGroups()).map((g) => ({ id: g.id, title: g.title, items: g.items.map((p) => ({ key: p.key, name: p.name, short: productShort(p.key, p.summary), features: featureCount(p.key) || p.capabilities.length })) }));
  const groups = FEATURE_LISTS[m.key] ?? [];
  const total = featureCount(m.key) || m.capabilities.length;
  const value = PANEL_VALUE[m.key];
  const detail = PANEL_DETAIL[m.key];
  const byKey = new Map(all.map((x) => [x.key, x]));
  const extras = (EXTRA_SCREENS[m.key] ?? []).filter((x) => screenFor(x.key));
  const slugOf = new Map(featuresOf(m.key).map((f) => [`${f.group}::${f.name}`, f.slug]));
  const explorerItems = groups.flatMap((g) => g.items.map((it) => { const slug = slugOf.get(`${g.title}::${it.name}`); return { name: it.name, text: it.text, group: g.title, href: slug ? productDocsPath(m.key, slug) : undefined }; }));
  const connects = (detail?.connects ?? []).flatMap((c) => { const o = byKey.get(c.panel); return o ? [{ o, text: c.text }] : []; });
  const guides = DOCS.filter((x) => x.panel === m.key);
  const tutorials = TUTORIALS.filter((t) => t.panel === m.key);
  const faqs = productFaqs(m, { groups, total, value, detail, connected: connects.map((c) => c.o.name), guides: [...tutorials.map((t) => t.title), ...guides.map((g) => g.title)].slice(0, 2) });
  const hasScreens = !!screenFor(m.key);
  const hasExtras = m.automations.length > 0 || !!detail?.ask?.length || connects.length > 0;
  const show: Record<string, boolean> = { why: !!value, how: !!detail, who: !!detail, extras: hasExtras, screens: hasScreens };
  const nav = SECTIONS.filter((s) => show[s.id] !== false);
  const numbered = nav.filter((x) => x.id !== "overview" && x.id !== "faq");
  const num = (id: string) => String(numbered.findIndex((x) => x.id === id) + 1).padStart(2, "0");
  const chapterProps = (id: string) => {
    const i = numbered.findIndex((x) => x.id === id);
    const nx = numbered[i + 1];
    return { id, n: num(id), total: numbered.length, label: numbered[i]?.label ?? "", next: nx ? { id: nx.id, label: nx.label } : { id: "faq", label: "Questions" }, tint: i % 2 === 1 };
  };

  const seoKeywords = PRODUCT_SEO[m.key]?.keywords ?? [];
  const shots = [screenFor(m.key), ...extras.map((x) => screenFor(x.key))].filter((x): x is string => !!x);
  const tagline = (PRODUCT_SEO[m.key]?.title ?? "").split(": ")[1] ?? "";
  const ld = [
    softwareApplication({
      path: productPath(m.key), name: m.name, alternateName: m.name.replace(/^SelfRun\s+/i, ""), description: `${m.headline}. ${m.summary}`,
      subCategory: PRODUCT_CATEGORY[m.key], audience: PRODUCT_AUDIENCE[m.key], features: m.capabilities, keywords: seoKeywords, screenshots: shots,
      related: connects.map(({ o }) => ({ name: o.name, path: productPath(o.key) })),
    }),
    webPage({ path: productPath(m.key), name: `${m.name}: ${PRODUCT_SEO[m.key]?.title ?? m.headline}`, description: `${m.headline}. ${m.summary}`, about: m.name }),
    breadcrumbList([{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: m.name, path: productPath(m.key) }]),
    faqPage(faqs),
    ...(detail?.workflow.length ? [howTo({ path: productPath(m.key), name: `How ${m.name} works`, description: `${m.headline}. ${m.summary}`, steps: detail.workflow.map((w) => ({ name: w.title, text: w.text })) })] : []),
  ];

  const endDot = (t: string) => (/[.!?]$/.test(t) ? t : `${t}.`);
  const heroLead = (
    <>
      <span className="block">{endDot(m.summary)}</span>
      <span className="mt-3 block text-[0.95em]">
        {detail?.intro ? endDot(detail.intro) : ""}{value ? ` It takes the place of ${soft(value.replaces)}.` : ""}
      </span>
    </>
  );
  const heroNotes = [`${total} features`, ...(groups.length ? [`${groups.length} feature groups`] : []), ...(detail?.workflow.length ? [`${detail.workflow.length}-step workflow`] : []), "Included in every plan"];
  const glance = [
    { icon: <Layers className="h-5 w-5" />, q: "What it does", a: m.headline },
    detail && { icon: <Users className="h-5 w-5" />, q: "Who uses it", a: detail.audience.map((a) => a.who).join(", ") },
    value && { icon: <Wallet className="h-5 w-5" />, q: "What it takes the place of", a: value.replaces },
    { icon: <ShieldCheck className="h-5 w-5" />, q: "What it costs", a: "Included in every plan. Free to start, no card needed." },
  ].filter(Boolean) as { icon: React.ReactNode; q: string; a: string }[];

  return (
    <>
      <JsonLd data={ld} />
      <PageHero art={`product-${m.key}`} eyebrow={`${tagline ? `${tagline} · ` : ""}${total} features`} title={m.name} lead={heroLead} notes={heroNotes} photo="analytics" shot={m.key} shotName={m.name}>
        <HeroCtas />
      </PageHero>

      <ScrollToTop pageKey={m.key} />
      <ProductScrollNav items={nav.map((x) => ({ id: x.id, label: x.label }))} name={m.name} />

      <div className="sr-container py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[350px_minmax(0,1fr)] xl:gap-14">
          <ProductSidebar groups={sidebarGroups} activeKey={m.key} />

          <div className="min-w-0 overflow-x-clip">
            {/* overview */}
            <Section id="overview">
              <div className="relative mb-6 overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-card to-brand-accent/[0.12] p-6 shadow-sm sm:p-8">
                <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" aria-hidden />
                <span className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-brand-accent/15 blur-3xl" aria-hidden />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                  <span className="flex h-20 w-20 flex-none items-center justify-center rounded-3xl border border-border/60 bg-card shadow-lg shadow-primary/10"><ProductLogo productKey={m.key} size={56} title={m.name} /></span>
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary"><Sparkles className="h-3.5 w-3.5" />Included in every plan</span>
                    <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{m.name}</h2>
                    <p className="mt-1 text-base leading-snug text-muted-foreground sm:text-lg">{productShort(m.key, m.summary)}</p>
                  </div>
                </div>
                <div className="relative mt-6 flex flex-wrap gap-3">
                  <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5">Start free <ArrowRight className="h-4 w-4" /></Link>
                  <a href="#walkthroughs" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition-colors hover:border-primary/40 hover:text-primary">See a walkthrough</a>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="At a glance">
                {glance.map((g, i) => (
                  <Reveal key={g.q} delay={i * 60}>
                    <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-brand-accent" aria-hidden />
                      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-accent text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-110">{g.icon}</span>
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{g.q}</p>
                      <p className="mt-1 text-[15px] font-bold leading-snug">{g.a}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div className="mt-8 overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
                <div className="relative border-b border-border/50 bg-gradient-to-br from-primary/[0.08] via-card to-brand-accent/[0.08] px-6 py-8 sm:px-10 sm:py-10">
                  <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl" aria-hidden />
                  <p className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary">What is it</p>
                  <h2 className="max-w-3xl text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl">What is {m.name}?</h2>
                  <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{detail?.intro ?? m.summary}</p>
                </div>

                <div className="grid items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
                      <p className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">In short</p>
                      <p className="text-[17px] leading-relaxed"><b>{m.name}</b>: {endDot(m.description)}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-brand-accent p-6 text-white shadow-xl shadow-primary/25">
                      <Sparkles className="absolute -right-3 -top-3 h-24 w-24 text-white/10" aria-hidden />
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">The result</p>
                      <p className="relative mt-1.5 text-xl font-bold leading-snug sm:text-2xl">{m.outcome}</p>
                    </div>
                  </div>
                  <Reveal><DeviceScene screenKey={m.key} name={m.name} variant={3} /></Reveal>
                </div>

                <div className="border-t border-border/50 bg-muted/20 px-6 py-8 sm:px-10 sm:py-10">
                  <h3 className="mb-5 flex items-center gap-2 text-lg font-black"><Check className="h-5 w-5 text-primary" />What you can do with it <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">{m.capabilities.length}</span></h3>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {m.capabilities.map((c, i) => (
                      <Reveal key={c} as="li" delay={i * 40} className="group flex items-start gap-3.5 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-accent text-sm font-black text-white shadow-md shadow-primary/20">{i + 1}</span>
                        <span className="pt-1 text-[16px] font-semibold leading-snug">{c}</span>
                      </Reveal>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* the chapters, on a rail that shows their order */}
            <div className="relative lg:pl-16">
              <span className="absolute bottom-8 left-[22px] top-12 hidden w-px bg-gradient-to-b from-primary/60 via-border to-transparent lg:block" aria-hidden />
            {/* why: a bento of reasons */}
            {value && (
              <Chapter {...chapterProps("why")} title={`Why teams choose ${m.name}`} lead={`${m.name} takes the place of ${soft(value.replaces)}, and it works together with the other SelfRun AI products you switch on.`}>
                <div className="grid gap-4 md:grid-cols-6">
                  <Reveal className="md:col-span-3">
                    <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-brand-accent p-8 text-white shadow-xl shadow-primary/25">
                      <span className="pointer-events-none absolute -bottom-10 -right-6 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden />
                      <p className="text-7xl font-black leading-none tracking-tighter sm:text-8xl"><CountUp to={total} /></p>
                      <p className="mt-3 text-xl font-bold">features in this product</p>
                      <p className="mt-1 text-white/80">{groups.slice(0, 3).map((g) => g.title).join(" · ")}{groups.length > 3 ? " · and more" : ""}</p>
                    </div>
                  </Reveal>
                  <Reveal className="md:col-span-3" delay={80}>
                    <div className="relative h-full overflow-hidden rounded-[2rem] bg-foreground p-8 text-background shadow-xl">
                      <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/40 blur-3xl" aria-hidden />
                      <p className="text-7xl font-black leading-none tracking-tighter sm:text-8xl"><CountUp to={m.automations.length} /></p>
                      <p className="mt-3 text-xl font-bold">automatic steps built in</p>
                      <p className="mt-1 text-background/70">{m.automations[0]}</p>
                    </div>
                  </Reveal>
                  {value.benefits.map((b, i) => (
                    <Reveal key={b} className="md:col-span-3" delay={i * 70}>
                      <div className={`${tile} h-full`}>
                        <span className="pointer-events-none absolute -right-2 -top-6 select-none bg-gradient-to-b from-primary/25 to-transparent bg-clip-text text-8xl font-black leading-none text-transparent" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg></span>
                        <p className="relative text-xl font-bold leading-snug">{b}</p>
                      </div>
                    </Reveal>
                  ))}
                  <Reveal className="md:col-span-6" delay={120}>
                    <div className="flex flex-col items-start gap-4 rounded-[2rem] border border-border/60 bg-gradient-to-r from-muted/50 to-primary/[0.06] p-7 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Instead of</p>
                        <p className="mt-1 text-2xl font-black text-muted-foreground line-through decoration-rose-500/70 decoration-[3px]">{value.replaces}</p>
                      </div>
                      <ArrowRight className="hidden h-8 w-8 flex-none text-primary sm:block" />
                      <div className="flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm"><ProductLogo productKey={m.key} size={38} title={m.name} /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Use</p><p className="text-2xl font-black leading-tight">{m.name}</p></div></div>
                    </div>
                  </Reveal>
                </div>
              </Chapter>
            )}

            {/* features: explorer */}
            <Chapter {...chapterProps("features")} title="Everything you can do" lead="Search, or pick a group. Open any feature to read its full guide. Every feature is included in every plan.">
              <FeatureExplorer productName={m.name} items={explorerItems} groups={groups.map((g) => ({ title: g.title, count: g.items.length }))} />
            </Chapter>

            {/* how it works */}
            {detail && (
              <Chapter {...chapterProps("how")} title="From start to finish" lead={detail.intro}>
                <StepperHowItWorks steps={detail.workflow.map((w) => ({ title: w.title, text: w.text }))} />
              </Chapter>
            )}

            {/* who uses it */}
            {detail && (
              <Chapter {...chapterProps("who")} title={`Who uses ${m.name}`} lead="Everyone sees only what their role allows, so each person gets a screen that fits their job.">
                <RoleExplorer productName={m.name} roles={detail.audience} />
              </Chapter>
            )}

            {/* smart extras */}
            {hasExtras && (
              <Chapter {...chapterProps("extras")} title="It works while you don't" lead="Pick a tab: questions you can ask in plain English, things that happen on their own, and the products it can pass work to.">
                  <ExtrasTabs
                    tabs={[
                      detail?.ask?.length ? { id: "ask", label: "Ask AI", count: detail.ask.length, icon: <Bot className="h-4 w-4" />, node: <AskAiDemo productName={m.name} questions={detail.ask} /> } : null,
                      m.automations.length ? {
                        id: "auto", label: "Runs by itself", count: m.automations.length, icon: <Zap className="h-4 w-4" />,
                        node: (
                          <div>
                            <ul className="grid gap-3 sm:grid-cols-2">
                              {m.automations.map((a) => (
                                <li key={a} className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-background p-4 text-[16px] font-semibold leading-snug shadow-sm"><span className="relative flex h-3 w-3 flex-none"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" /></span>{a}</li>
                              ))}
                            </ul>
                            <p className="mt-4 text-sm text-muted-foreground">Build your own in <Link href={`${productPath("workspace")}#features`} className="font-bold text-primary underline underline-offset-2">Workspace → Automations</Link>.</p>
                          </div>
                        ),
                      } : null,
                      connects.length ? {
                        id: "with", label: "Works with", count: connects.length, icon: <Plug className="h-4 w-4" />,
                        node: (
                          <div>
                            <p className="mb-4 text-sm text-muted-foreground">{m.name} works fully on its own. These are the other products it can pass work to, if you want it to.</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {connects.map(({ o, text }) => (
                                <Link key={o.key} href={productPath(o.key)} className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm"><ProductLogo productKey={o.key} size={32} title={o.name} /></span>
                                  <span className="min-w-0"><span className="block font-black leading-snug group-hover:text-primary">{o.name}</span><span className="mt-0.5 block text-sm text-muted-foreground">{text}</span></span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ),
                      } : null,
                    ].filter((t): t is NonNullable<typeof t> => t !== null)}
                  />
                </Chapter>
            )}

            {/* screens */}
            {hasScreens && (
              <Chapter {...chapterProps("screens")} title={`${m.name}, as your team sees it`} lead="Real screens of the live product, captured in a demo workspace with sample data.">
                <ScreenGallery
                  name={m.name}
                  shots={[{ key: m.key, title: "Dashboard", src: screenFor(m.key)! }, ...extras.map((x) => ({ key: x.key, title: x.title, src: screenFor(x.key)! }))]}
                />
              </Chapter>
            )}

            {/* walkthroughs */}
            <Chapter {...chapterProps("walkthroughs")} title={`Learn ${m.name} step by step`} lead="Learn by doing: start with the three steps, then follow a walkthrough for one job at a time, or take the quick tour of how a job moves through the product.">
              <h3 className="mb-1 text-lg font-black">Your first three steps</h3>
              <p className="mb-4 text-sm text-muted-foreground">First register free and switch on {m.name} in your business setup. Then:</p>
              <ol className="mb-10 grid gap-4 sm:grid-cols-3">
                {(PRODUCT_START[m.key] ?? [
                  { t: "Register free", x: "Create your workspace with your work email. No card needed." },
                  { t: `Switch on ${m.name}`, x: "Switch it on in your business setup, then invite your team and give each person a role." },
                  { t: "Follow a walkthrough", x: tutorials[0] ? `Start with “${tutorials[0].title}” below.` : "Then open its guides in the Docs section." },
                ]).map((st, i) => (
                  <Reveal key={st.t} as="li" delay={i * 70} className={`${tile}`}>
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-accent text-sm font-black text-white shadow-lg shadow-primary/25">{i + 1}</span>
                    <p className="font-black leading-snug">{st.t}</p><p className="mt-1 text-[15px] text-muted-foreground">{st.x}</p>
                  </Reveal>
                ))}
              </ol>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><GraduationCap className="h-5 w-5 text-primary" />{tutorials.length > 0 ? `${tutorials.length === 1 ? "The walkthrough" : `${tutorials.length} walkthroughs`} for ${m.name}` : `Walkthroughs for ${m.name}`}</h3>
              {tutorials.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {tutorials.map((t) => (
                    <Link key={t.slug} href={`/docs/walkthroughs/${t.slug}`} className="group flex flex-col rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-primary/[0.06] p-6 transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                      <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-wider text-primary-foreground"><GraduationCap className="h-3.5 w-3.5" />Walkthrough</span>
                      <span className="text-xl font-black leading-snug">{t.title}</span>
                      <span className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{t.summary}</span>
                      <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-muted-foreground"><span>{t.steps.length} steps</span><span>{t.minutes} min</span><span>{t.level}</span><span className="ml-auto font-bold text-primary">Start the walkthrough <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></span></span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-[15px] text-muted-foreground">There is no step-by-step walkthrough for {m.name} yet. Its guides are in the next section, and every feature has its own guide.</p>
              )}
              {detail && (
                <>
                  <h3 className="mb-1 mt-12 flex items-center gap-2 text-lg font-black"><MapIcon className="h-5 w-5 text-primary" />Quick tour: {m.name} in {detail.workflow.length} steps</h3>
                  <p className="mb-4 text-sm text-muted-foreground">How a job moves through {m.name}, from the first step to the last. Try it in the product after you register.</p>
                  <ol className="grid gap-3 sm:grid-cols-2">
                    {detail.workflow.map((w, i) => (
                      <li key={w.title} className="flex gap-4 rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">{i + 1}</span>
                        <div className="min-w-0"><span className="mb-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Quick tour</span><p className="font-black leading-snug">{w.title}</p><p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{w.text}</p></div>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 text-sm"><Link href="/signup" className="font-bold text-primary hover:underline">Start the tour in the product, free <ArrowRight className="ml-1 inline h-4 w-4" /></Link></p>
                </>
              )}
              <p className="mt-8 text-sm"><Link href="/docs#walkthroughs" className="font-bold text-primary hover:underline">All walkthroughs for every product <ArrowRight className="ml-1 inline h-4 w-4" /></Link></p>
            </Chapter>

            {/* docs */}
            <Chapter {...chapterProps("docs")} title={`${m.name} documentation`} lead="Guides and references you can read any time: what each part does, how to set it up and how it fits with the rest.">
              <div className="grid gap-4 md:grid-cols-2">
                {guides.map((g) => (
                  <Link key={g.slug} href={`/docs/${g.slug}`} className={`${tile} flex flex-col`}>
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-black uppercase tracking-wider text-foreground"><BookOpen className="h-3.5 w-3.5" />Guide</span>
                    <span className="text-xl font-black leading-snug">{g.title}</span>
                    <span className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{g.summary}</span>
                    <span className="mt-4 flex items-center gap-4 text-sm font-semibold text-muted-foreground"><span>{g.readMinutes} min read</span><span className="ml-auto font-bold text-primary">Read the guide <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></span></span>
                  </Link>
                ))}
                {total > 0 && (
                  <a href="#features" className={`${tile} flex flex-col`}>
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-black uppercase tracking-wider text-foreground"><Layers className="h-3.5 w-3.5" />Feature guides</span>
                    <span className="text-xl font-black leading-snug">{total} feature guides</span>
                    <span className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">Every feature of {m.name} has its own guide. Search the features above and open the one you need.</span>
                    <span className="mt-4 text-sm font-bold text-primary">See the features <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </a>
                )}
                <Link href={`/docs#${m.key}`} className="group flex flex-col justify-center rounded-3xl border border-dashed border-primary/40 bg-primary/[0.04] p-6 transition-colors hover:bg-primary/[0.08]">
                  <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-wider text-primary-foreground"><BookOpen className="h-3.5 w-3.5" />Documentation</span>
                  <span className="text-xl font-black leading-snug">All {m.name} documentation</span>
                  <span className="mt-1.5 text-[15px] text-muted-foreground">Every guide for {m.name} in one place, in the documentation.</span>
                  <span className="mt-4 text-sm font-bold text-primary">Open the docs <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </div>
            </Chapter>
            </div>

            {/* prev / next */}
            <section className="border-t border-border/50 pt-10">
              <div className="grid gap-4 sm:grid-cols-2">
                {[{ p: prev, dir: "Previous product" }, { p: next, dir: "Next product" }].map(({ p, dir }, i) => (
                  <Link key={dir} data-product-link href={productPath(p.key)} className={`group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card to-primary/[0.06] p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 ${i ? "sm:flex-row-reverse sm:text-right" : ""}`}>
                    <span className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl border border-border/60 bg-background shadow-sm transition-transform group-hover:scale-105"><ProductLogo productKey={p.key} size={44} title={p.name} /></span>
                    <span className="min-w-0 flex-1"><span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">{dir}</span><span className="mt-1 block text-lg font-black leading-snug">{p.name}</span><span className="block truncate text-sm text-muted-foreground">{productShort(p.key, p.summary)}</span></span>
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform"><ArrowRight className={`h-5 w-5 ${i ? "group-hover:translate-x-0.5" : "rotate-180 group-hover:-translate-x-0.5"}`} /></span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <CtaBand title={`Run ${m.name}, and every other product, free.`} lead="Every feature is included in every plan. Start free, no card needed." />

      {/* questions: the last thing on the page, just above the footer */}
      <section id="faq" className="scroll-mt-36 border-t border-border/50 bg-muted/30 py-14 lg:py-20">
        <div className="sr-container max-w-4xl">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Questions</p>
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">Questions about {m.name}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">What people ask before they start, answered from what the product really does today.</p>
          </div>
          <ProductFaqList items={faqs} />
        </div>
      </section>
    </>
  );
}
