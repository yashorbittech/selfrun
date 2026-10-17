import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { AI_CAPABILITIES, INTEGRATIONS, SECURITY_POINTS } from "@/lib/platform/saas/content";
import { getFeatureGroups } from "@/lib/platform/saas/modules";
import { PANEL_VALUE, featureCount } from "@/lib/platform/saas/feature-lists";
import { YOUR_BRAND } from "@/lib/platform/saas/site";
import { marketingFor, screenFor } from "@/lib/platform/saas/screens";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import FaqSection from "@/components/platform/saas/FaqSection";
import Icon from "@/components/platform/saas/Icon";
import Reveal from "@/components/platform/saas/Reveal";
import PanelShot from "@/components/platform/saas/PanelShot";
import type { IconKey } from "@/lib/platform/saas/content";
import { productPath } from "@/lib/platform/saas/product-routes";
import ProductLogo from "@/components/products/ProductLogo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Products",
  description:
    "Every product of SelfRun AI at a glance — CRM, HR & payroll, finance, projects, procurement, training, documents, website, AI and automation — each with a details page covering every feature.",
  alternates: { canonical: "/products" },
};

/** High-impact real-time status beacon per product */
const PRODUCT_BEACONS: Record<string, string> = {
  workspace: "⚡ 20 Integrated Modules · Live Command Center",
  lms: "🎉 Won Deal: Enterprise CRM Pipeline Synchronized",
  hrms: "👥 Automated Payroll & Attendance Calculated",
  fms: "💳 Tax Invoicing · Ledger Auto-Reconciled",
  pms: "🚀 Agile Sprint Milestone Completed & Billed",
  prms: "📦 3-Way Match: PO, Goods Receipt & Vendor Bill",
  tms: "🎓 Batch Enrolment · Verifiable Certificate Issued",
  messenger: "💬 Team Channels & Live Video Beside Work",
  sop: "📜 Versioned Standard Operating Procedures",
  lpms: "✍️ Legal Agreements & E-Signatures Active",
  dlms: "🔒 Zero-Trust Encrypted Document Vault",
  ots: "⏱️ Timed Online Candidate Skill Assessment",
  aibots: "🤖 Autonomous Copilot Grounded in Knowledge",
  intelligence: "📊 Live Financial Query Calculated from Ledger",
  smms: "📱 AI Social Media Campaign Scheduled",
  seo: "🔍 Technical Audit 98/100 · Rankings Tracked",
  cms: "🌐 Drag & Drop Site Builder · Automatic SSL",
  portal: "🏢 White-Label Client & Student Portal",
  support: "🎧 24/7 AI Helpdesk & Request Ticketing",
  website: "⚡ Public Website Live on Custom Domain",
};

/** Category aura gradients */
const CATEGORY_AURAS: Record<string, string> = {
  lms: "from-indigo-500/20 via-purple-500/10 to-transparent",
  fms: "from-emerald-500/20 via-teal-500/10 to-transparent",
  hrms: "from-amber-500/20 via-orange-500/10 to-transparent",
  pms: "from-blue-500/20 via-indigo-500/10 to-transparent",
  prms: "from-teal-500/20 via-cyan-500/10 to-transparent",
  tms: "from-rose-500/20 via-orange-500/10 to-transparent",
  aibots: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
  intelligence: "from-purple-500/20 via-indigo-500/10 to-transparent",
  cms: "from-sky-500/20 via-blue-500/10 to-transparent",
  seo: "from-cyan-500/20 via-emerald-500/10 to-transparent",
  smms: "from-fuchsia-500/20 via-pink-500/10 to-transparent",
  dlms: "from-indigo-500/20 via-cyan-500/10 to-transparent",
  sop: "from-amber-500/20 via-yellow-500/10 to-transparent",
  lpms: "from-rose-500/20 via-pink-500/10 to-transparent",
  ots: "from-emerald-500/20 via-sky-500/10 to-transparent",
  workspace: "from-primary/20 via-brand-accent/15 to-transparent",
};

function IconList({
  items,
}: {
  items: { title: string; body: string; icon: IconKey }[];
}) {
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((x, i) => (
        <Reveal key={x.title} delay={(i % 3) * 70} className="flex gap-4">
          <span className="sr-icon h-12 w-12 flex-none">
            <Icon name={x.icon} className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-black">{x.title}</span>
            <span className="block text-sm leading-relaxed text-muted-foreground">
              {x.body}
            </span>
          </span>
        </Reveal>
      ))}
    </div>
  );
}

export default async function ProductsPage() {
  const groups = await getFeatureGroups();
  const all = groups.flatMap((g) => g.items);
  const total = all.reduce(
    (n, m) => n + (featureCount(m.key) || m.capabilities.length),
    0
  );

  return (
    <>
      <PageHero
        art="features"
        eyebrow={`${all.length} standalone SaaS products · ${total}+ features`}
        title="Every software product."
        accent="Built for modern business."
        lead="Each product below is a complete, market-ready software engine engineered with native AI. Use and deploy products independently, or manage the suite from one place and configure the workflows you want between them."
        photo="analytics"
        shot="workspace"
        chip={{
          title: "All 20 Products Included",
          text: "Free forever plan with full access to every feature",
        }}
      >
        <HeroCtas />
      </PageHero>

      {/* Sticky High-Tech Filter Navigation Bar */}
      <nav
        aria-label="Product groups"
        className="sticky top-[76px] z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl shadow-sm"
      >
        <div className="sr-container sr-scroll-x flex gap-2.5 py-3.5">
          {groups.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-primary/10 hover:border-primary/40 hover:text-primary"
            >
              <Icon name={g.icon} className="h-3.5 w-3.5 text-primary" />
              <span>{g.title}</span>
            </a>
          ))}
          <a
            href="#platform"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            Across every product
          </a>
          <a
            href="#faq"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            FAQs
          </a>
        </div>
      </nav>

      {/* Product Groups Section */}
      {groups.map((g, gi) => (
        <section
          key={g.id}
          id={g.id}
          className={`sr-section ${gi % 2 === 0 ? "bg-muted/10" : ""}`}
          style={{ scrollMarginTop: 140 }}
        >
          <div className="sr-container">
            <SectionHead
              icon={g.icon}
              eyebrow={`${g.items.length} ${
                g.items.length === 1 ? "Product" : "Products"
              } in this Category`}
              title={g.title}
              lead={g.lead}
            />

            <div className="space-y-16 lg:space-y-28">
              {g.items.map((m, i) => {
                const img = marketingFor(m.key) ?? screenFor(m.key);
                const value = PANEL_VALUE[m.key];
                const count = featureCount(m.key) || m.capabilities.length;
                const isEven = i % 2 === 1;
                const beacon = PRODUCT_BEACONS[m.key] ?? "⚡ Autonomous AI Engine Active";
                const auraGradient = CATEGORY_AURAS[m.key] ?? "from-primary/20 via-brand-accent/15 to-transparent";

                return (
                  <Reveal key={m.key}>
                    <article
                      id={m.key}
                      style={{ scrollMarginTop: 140 }}
                      className="group relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-gradient-to-br from-card via-card/95 to-muted/30 p-6 sm:p-9 lg:p-12 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-[0_30px_70px_-15px_rgba(79,70,229,0.22)]"
                    >
                      {/* Top ambient highlight line on hover */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-20" />

                      {/* Dynamic Product Category Aura Glow */}
                      <span
                        className={`pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-br ${auraGradient} blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100`}
                        aria-hidden
                      />

                      {/* Top Spec Header Bar Inside Card */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-6 mb-8 sm:mb-10">
                        {/* Left: Product Identity */}
                        <div className="flex items-center gap-3.5">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 shadow-sm transition-transform duration-500 group-hover:scale-105">
                            <ProductLogo productKey={m.key} size={48} title={m.name} />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-primary">
                                {g.title}
                              </span>
                              <span className="text-muted-foreground/40">/</span>
                              <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10.5px] font-mono font-bold text-muted-foreground">
                                {m.key.toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground/80">
                              Autonomous SaaS Engine
                            </span>
                          </div>
                        </div>

                        {/* Right: Modern Spec Badges */}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm backdrop-blur">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            AI Powered
                          </span>
                          <span className="rounded-full border border-border/60 bg-muted/40 px-3.5 py-1 font-mono font-bold text-muted-foreground">
                            {String(i + 1).padStart(2, "0")} / {g.items.length}
                          </span>
                        </div>
                      </div>

                      {/* 2-Column Split: 3D Visual Stage & Content Bento */}
                      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                        {/* 3D Perspective Visual Mockup Stage */}
                        <div
                          className={`lg:col-span-6 ${isEven ? "lg:order-2" : ""}`}
                          style={{ perspective: "1500px" }}
                        >
                          <Link
                            href={productPath(m.key)}
                            className="group/screen block relative"
                            aria-label={`${m.name} details`}
                          >
                            <div
                              className={`relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 p-2 shadow-2xl shadow-primary/20 ring-1 ring-border/60 backdrop-blur-md transition-transform duration-700 ease-out group-hover/screen:rotate-0 group-hover/screen:scale-[1.02] ${
                                isEven
                                  ? "[transform:rotateY(3deg)_rotateX(2deg)]"
                                  : "[transform:rotateY(-3deg)_rotateX(2deg)]"
                              }`}
                            >
                              {/* macOS Window Titlebar Chrome */}
                              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/50 rounded-t-xl text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90 shadow-sm" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90 shadow-sm" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90 shadow-sm" />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/80 px-3 py-0.5 text-[11px] font-mono text-muted-foreground shadow-inner">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  <span>selfrun.com/{m.key}</span>
                                </div>
                                <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                                  Live <ArrowUpRight className="h-3 w-3" />
                                </span>
                              </div>

                              {/* Screen Frame with Zoom */}
                              <div className="relative aspect-[16/10] overflow-hidden rounded-b-xl bg-muted/30">
                                {img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={img}
                                    alt={`${m.name} — real screen`}
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover/screen:scale-105"
                                    style={{
                                      transform: "scale(1.15)",
                                      transformOrigin: "50% 48%",
                                    }}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/[0.07] via-background to-brand-accent/[0.07] p-4">
                                    <PanelShot
                                      moduleKey={m.key}
                                      name={m.name}
                                      labels={[]}
                                    />
                                  </div>
                                )}

                                {/* Soft bottom vignette overlay */}
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                              </div>
                            </div>

                            {/* Floating Interactive Live Beacon Pill */}
                            <div className="absolute -bottom-4 left-6 z-20 flex items-center gap-2.5 rounded-2xl border border-border/80 bg-background/95 px-4 py-2 text-xs font-bold text-foreground shadow-2xl backdrop-blur-xl ring-1 ring-primary/20 transition-transform duration-500 group-hover:-translate-y-1">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Sparkles className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate max-w-[240px] sm:max-w-none">
                                {beacon}
                              </span>
                            </div>
                          </Link>
                        </div>

                        {/* Content & Capabilities Chamber */}
                        <div
                          className={`space-y-6 lg:col-span-6 ${
                            isEven ? "lg:order-1" : ""
                          }`}
                        >
                          <div>
                            {/* Product Name & Feature Count Pill */}
                            <div className="flex flex-wrap items-center gap-3 mb-2.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 px-3 py-1 text-xs font-bold text-primary">
                                <ProductLogo productKey={m.key} size={16} title={m.name} />
                                {m.name}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                {count} Built-in Features
                              </span>
                            </div>

                            <h3 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground transition-colors group-hover:text-primary">
                              <Link href={productPath(m.key)}>
                                {m.name}
                              </Link>
                            </h3>
                            <p className="mt-2 text-lg font-bold text-primary leading-snug">
                              {m.headline}
                            </p>
                            <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
                              {m.summary}
                            </p>
                          </div>

                          {/* Replaces Legacy Stack Chip */}
                          {value && (
                            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/20 bg-primary/[0.07] p-3 text-xs font-medium backdrop-blur-sm">
                              <span className="rounded-lg bg-primary/15 px-2.5 py-0.5 font-bold uppercase tracking-wider text-primary text-[10px]">
                                Replaces Legacy Stack
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-semibold text-foreground/90">
                                {value.replaces}
                              </span>
                            </div>
                          )}

                          {/* Key Capabilities Bento Cards */}
                          <div className="grid gap-2.5 pt-1">
                            {(value?.benefits ?? m.capabilities)
                              .slice(0, 3)
                              .map((benefit) => (
                                <div
                                  key={benefit}
                                  className="group/item flex items-start gap-3 rounded-2xl border border-border/50 bg-background/50 p-3.5 text-xs sm:text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-muted/40 hover:translate-x-1"
                                >
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors mt-0.5">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <span className="leading-relaxed">
                                    {benefit}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {/* Card Action Footer */}
                          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                            <div className="flex flex-wrap items-center gap-3">
                              <Link
                                href={productPath(m.key)}
                                className="group/btn inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:gap-3 hover:bg-primary/90 hover:scale-105"
                              >
                                Explore {m.name}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                              </Link>
                              <Link
                                href={`/docs#${m.key}`}
                                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-5 py-3 text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                              >
                                <BookOpen className="h-4 w-4" />
                                Documentation
                              </Link>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Free on all plans
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {/* Platform & Across Every Product */}
      <section
        id="platform"
        className="sr-section border-t border-border/50"
        style={{ scrollMarginTop: 140 }}
      >
        <div className="sr-container space-y-24">
          <div>
            <SectionHead
              icon="brain"
              eyebrow="Across every product"
              title="AI built into"
              accent="the whole platform."
              lead="Ask questions about your data, build assistants on your own documents, put an AI chatbot on your website, draft social posts and use AI steps inside workflows. Each AI feature respects who is asking, answers show how they were calculated, and usage is metered per plan."
            />
            <IconList items={AI_CAPABILITIES} />
          </div>
          <div>
            <SectionHead
              icon="target"
              eyebrow="White label"
              title="Your brand,"
              accent="everywhere."
              lead="Your team, your clients and your visitors see your company. Every item below is a real setting in the Workspace."
            />
            <IconList
              items={YOUR_BRAND.map((b) => ({
                title: b.title,
                body: b.text,
                icon: b.icon,
              }))}
            />
          </div>
          <div>
            <SectionHead
              icon="plug"
              eyebrow="Integrations"
              title="Connect what"
              accent="you already use."
            />
            <IconList
              items={INTEGRATIONS.map((x) => ({
                title: x.name,
                body: x.body,
                icon: x.icon,
              }))}
            />
          </div>
          <div>
            <SectionHead
              icon="shield"
              eyebrow="Security"
              title="Control and protection"
              accent="built in."
            />
            <IconList items={SECURITY_POINTS} />
            <Link href="/security" className="sr-link mt-10">
              Read how security and trust work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
      <FaqSection
        topics={[
          "AI & automation",
          "Your brand",
          "Apps & devices",
          "Data & security",
          "Setup",
        ]}
        limit={7}
        title="Questions about"
        accent="the products."
        lead="How the products, AI and automation, your own brand and apps, devices and data work."
      />
    </>
  );
}
