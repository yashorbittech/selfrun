import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, Bot, BookOpen, Check, ChevronRight, GraduationCap, Layers, Map as MapIcon, Monitor, Plug, Route, ShieldCheck, Sparkles, Users, Wallet, Zap, type LucideIcon } from "lucide-react";
import { getFeatureModules } from "@/lib/platform/saas/modules";
import { FEATURE_LISTS, PANEL_VALUE, featureCount, featuresOf } from "@/lib/platform/saas/feature-lists";
import { PANEL_DETAIL } from "@/lib/platform/saas/panel-detail";
import { EXTRA_SCREENS } from "@/lib/platform/saas/site";
import { screenFor } from "@/lib/platform/saas/screens";
import { CtaBand, HeroCtas, PageHero } from "@/components/platform/saas/blocks";
import ProductLogo from "@/components/products/ProductLogo";
import Reveal from "@/components/platform/saas/Reveal";
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
import ProductNav from "@/components/platform/saas/ProductNav";
import ProductFaqList from "@/components/platform/saas/ProductFaq";
import FeatureExplorer from "@/components/platform/saas/product/FeatureExplorer";
import ScrollToTop from "@/components/platform/saas/product/ScrollToTop";
import ScreenGallery from "@/components/platform/saas/product/ScreenGallery";

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
  return <section id={id} className="scroll-mt-32">{children}</section>;
}

/**
 * One section of the page, laid out the way the documentation guides are: an icon heading, a short line saying what the section is for,
 * and the content. The contents list on the right follows these sections.
 */
function DocSection({ id, icon: I, title, lead, children }: { id: string; icon: LucideIcon; title: React.ReactNode; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <h2 className="mb-3 flex items-center gap-3 text-xl font-black sm:text-2xl">
        <span className="sr-icon h-9 w-9 flex-none rounded-xl"><I className="h-4.5 w-4.5" /></span>
        {title}
      </h2>
      {lead && <p className="mb-6 max-w-3xl leading-relaxed text-muted-foreground">{lead}</p>}
      {children}
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
  const navPanels = all.map((p) => { const fs = featuresOf(p.key); return { key: p.key, name: p.name, short: productShort(p.key, p.summary), groups: [...new Set(fs.map((x) => x.group))].map((g) => ({ name: g, items: fs.filter((x) => x.group === g).map((x) => ({ slug: x.slug, name: x.name })) })) }; }).filter((p) => p.groups.length);
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
  const heroNotes = ["Every feature included", ...(detail?.workflow.length ? [`${detail.workflow.length}-step workflow`] : []), "Included in every plan"];
  const glance = [
    { icon: <Layers className="h-5 w-5" />, q: "What it does", a: m.headline },
    detail && { icon: <Users className="h-5 w-5" />, q: "Who uses it", a: detail.audience.map((a) => a.who).join(", ") },
    value && { icon: <Wallet className="h-5 w-5" />, q: "What it takes the place of", a: value.replaces },
    { icon: <ShieldCheck className="h-5 w-5" />, q: "What it costs", a: "Included in every plan. Free to start, no card needed." },
  ].filter(Boolean) as { icon: React.ReactNode; q: string; a: string }[];

  return (
    <>
      <JsonLd data={ld} />
      <PageHero art={`product-${m.key}`} eyebrow={tagline || "Part of SelfRun AI"} title={m.name} lead={heroLead} notes={heroNotes} photo="analytics" shot={m.key} shotName={m.name}>
        <HeroCtas />
      </PageHero>

      <ScrollToTop pageKey={m.key} />
      <div className="sr-container py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[340px_minmax(0,1fr)_280px] 2xl:grid-cols-[380px_minmax(0,1fr)_300px]">
          <aside className="hidden xl:block" aria-label="All products">
            <div className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm">
              <ProductNav panels={navPanels} currentKey={m.key} />
            </div>
          </aside>

          <div className="min-w-0 space-y-12 overflow-x-clip">
            <details className="group rounded-2xl border border-border/60 bg-background shadow-sm xl:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold"><span className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />Browse all products</span><ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" /></summary>
              <div className="max-h-[70vh] overflow-hidden border-t border-border/60 [&>nav]:max-h-[70vh]"><ProductNav panels={navPanels} currentKey={m.key} /></div>
            </details>
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/products" className="hover:text-primary">Products</Link><ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">{m.name}</span>
            </nav>
            {/* overview */}
            <Section id="overview">
              {screenFor(m.key) && (
                <figure className="mb-8">
                  <div className="sr-stage p-3 sm:p-5">
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl">
                      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-3.5 py-2.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /><span className="ml-3 truncate rounded-full bg-background px-3 py-0.5 text-[11px] text-muted-foreground">{m.name}</span></div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={screenFor(m.key)!} alt={`${m.name}: a real screen`} width={1280} height={800} loading="eager" decoding="async" className="block h-auto w-full" />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-center text-xs text-muted-foreground">A real screen of {m.name}, captured in a demo workspace with sample data.</figcaption>
                </figure>
              )}
              <h2 className="mb-3 flex items-center gap-3 text-xl font-black sm:text-2xl"><span className="sr-icon h-9 w-9 flex-none rounded-xl"><BookOpen className="h-4.5 w-4.5" /></span>What is {m.name}?</h2>
              <p className="max-w-3xl leading-relaxed text-muted-foreground">{detail?.intro ?? m.summary}</p>
              <p className="mt-3 max-w-3xl rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed"><b>In short.</b> <span className="text-muted-foreground">{endDot(m.description)} {m.outcome}</span></p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5">Start free <ArrowRight className="h-4 w-4" /></Link>
                <a href="#walkthroughs" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition-colors hover:border-primary/40 hover:text-primary">See a walkthrough</a>
              </div>

              <h3 className="mb-4 mt-10 flex items-center gap-2 text-lg font-black"><Check className="h-5 w-5 text-primary" />What you can do with it</h3>
              <ul className="space-y-2.5">
                {m.capabilities.map((c) => <li key={c} className="flex gap-3"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span className="leading-snug">{c}</span></li>)}
              </ul>

              <h3 className="mb-4 mt-10 flex items-center gap-2 text-lg font-black"><Layers className="h-5 w-5 text-primary" />At a glance</h3>
              <ul className="grid gap-3 sm:grid-cols-2" aria-label="At a glance">
                {glance.map((g) => <li key={g.q} className="rounded-2xl border border-border/60 p-4"><p className="text-xs font-bold uppercase tracking-widest text-primary">{g.q}</p><p className="mt-1 font-semibold leading-snug">{g.a}</p></li>)}
              </ul>
            </Section>

            {/* the guide sections */}
            <div className="space-y-12">
            {/* why */}
            {value && (
              <DocSection id="why" icon={Sparkles} title={`Why teams choose ${m.name}`} lead={`${m.name} takes the place of ${soft(value.replaces)}, and it works together with the other SelfRun AI products you switch on.`}>
                <ul className="space-y-2.5">
                  {value.benefits.map((b) => <li key={b} className="flex gap-3"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span className="leading-snug">{b}</span></li>)}
                </ul>
                <p className="mt-5 max-w-3xl rounded-2xl border border-border/60 p-4 text-sm leading-relaxed"><b>Instead of:</b> <span className="text-muted-foreground">{value.replaces}. Use {m.name} and keep the work in one place. Every feature is included in every plan.</span></p>
              </DocSection>
            )}

            {/* features: explorer */}
            <DocSection id="features" icon={Layers} title="Everything you can do" lead="Search, or pick a group. Open any feature to read its full guide. Every feature is included in every plan.">
              <FeatureExplorer productName={m.name} items={explorerItems} groups={groups.map((g) => ({ title: g.title, count: g.items.length }))} />
            </DocSection>

            {/* how it works */}
            {detail && (
              <DocSection id="how" icon={Route} title="From start to finish" lead={detail.intro}>
                <ol className="sr-steps space-y-7">
                  {detail.workflow.map((w, n) => (
                    <li key={w.title} className="relative pl-16">
                      <span className="sr-circle absolute left-0 top-0 h-11 w-11 text-base font-black shadow-lg shadow-primary/30 ring-4 ring-background">{n + 1}</span>
                      <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">Step {n + 1}</p>
                        <p className="mt-1 text-lg font-black leading-snug">{w.title}</p>
                        <p className="mt-1.5 leading-relaxed text-muted-foreground">{w.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </DocSection>
            )}

            {/* who uses it */}
            {detail && (
              <DocSection id="who" icon={Users} title={`Who uses ${m.name}`} lead="Everyone sees only what their role allows, so each person gets a screen that fits their job.">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {detail.audience.map((a) => <li key={a.who} className="rounded-2xl border border-border/60 p-4"><p className="font-black">{a.who}</p><p className="text-sm leading-snug text-muted-foreground">{a.does}</p></li>)}
                </ul>
              </DocSection>
            )}

            {/* automations, AI and connections */}
            {hasExtras && (
              <DocSection id="extras" icon={Zap} title="Automations & AI" lead="Questions you can ask in plain English, things that happen on their own, and the products it can pass work to.">
                <div className="space-y-9">
                  {detail?.ask?.length ? (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Bot className="h-5 w-5 text-primary" />Ask in plain English</h3>
                      <ul className="space-y-2">{detail.ask.map((q) => <li key={q} className="rounded-2xl border border-border/60 bg-background p-4 text-[15px] font-semibold leading-snug">“{q}”</li>)}</ul>
                    </div>
                  ) : null}
                  {m.automations.length ? (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Zap className="h-5 w-5 text-primary" />Runs by itself</h3>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {m.automations.map((a) => <li key={a} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 text-[15px] font-semibold leading-snug shadow-sm"><span className="relative flex h-2.5 w-2.5 flex-none"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>{a}</li>)}
                      </ul>
                      <p className="mt-3 text-sm text-muted-foreground">Build your own in <Link href={`${productPath("workspace")}#features`} className="font-bold text-primary underline underline-offset-2">Workspace → Automations</Link>.</p>
                    </div>
                  ) : null}
                  {connects.length ? (
                    <div>
                      <h3 className="mb-1 flex items-center gap-2 text-lg font-black"><Plug className="h-5 w-5 text-primary" />Works with</h3>
                      <p className="mb-3 text-sm text-muted-foreground">{m.name} works fully on its own. These are the other products it can pass work to, if you want it to.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {connects.map(({ o, text }) => (
                          <Link key={o.key} href={productPath(o.key)} className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm"><ProductLogo productKey={o.key} size={32} title={o.name} /></span>
                            <span className="min-w-0"><span className="block font-black leading-snug group-hover:text-primary">{o.name}</span><span className="mt-0.5 block text-sm text-muted-foreground">{text}</span></span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </DocSection>
            )}

            {/* screens */}
            {hasScreens && (
              <DocSection id="screens" icon={Monitor} title={`${m.name}, as your team sees it`} lead="Real screens of the live product, captured in a demo workspace with sample data.">
                <ScreenGallery
                  name={m.name}
                  shots={[{ key: m.key, title: "Dashboard", src: screenFor(m.key)! }, ...extras.map((x) => ({ key: x.key, title: x.title, src: screenFor(x.key)! }))]}
                />
              </DocSection>
            )}

            {/* walkthroughs */}
            <DocSection id="walkthroughs" icon={GraduationCap} title={`Learn ${m.name} step by step`} lead="Learn by doing: start with the three steps, then follow a walkthrough for one job at a time, or take the quick tour of how a job moves through the product.">
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
              <h3 className="mb-4 flex items-center gap-2 text-lg font-black"><GraduationCap className="h-5 w-5 text-primary" />{tutorials.length === 1 ? `The walkthrough for ${m.name}` : `Walkthroughs for ${m.name}`}</h3>
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
            </DocSection>

            {/* docs */}
            <DocSection id="docs" icon={BookOpen} title={`${m.name} documentation`} lead="Guides and references you can read any time: what each part does, how to set it up and how it fits with the rest.">
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
                    <span className="text-xl font-black leading-snug">A guide for every feature</span>
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
            </DocSection>
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

          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-5">
              <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3"><span className="sr-icon h-10 w-10"><ProductLogo productKey={m.key} size={36} title={m.name} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Product</p><p className="font-black leading-tight">{m.name}</p></div></div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">On this page</p>
                <ul className="space-y-0.5 border-l border-border/60">
                  {nav.map((t) => <li key={t.id}><a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">{t.label}</a></li>)}
                </ul>
              </div>
              <div className="sr-band rounded-3xl p-5 shadow-xl shadow-primary/20">
                <p className="font-black leading-snug">Use {m.name} in your own workspace.</p>
                <p className="mt-1 text-sm text-white/75">Free to start. Every feature included.</p>
                <Link href="/signup" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-105">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </aside>
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
