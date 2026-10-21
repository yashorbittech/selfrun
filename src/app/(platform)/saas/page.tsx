import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/platform/saas/seo-meta";
import JsonLd from "@/components/platform/saas/JsonLd";
import { itemList, planOffers, softwareApplication, webPage } from "@/lib/platform/saas/jsonld";
import { ArrowRight, Check } from "lucide-react";
import { AI_CAPABILITIES, HOW_IT_WORKS, INDUSTRIES, SECURITY_POINTS } from "@/lib/platform/saas/content";
import { AI_BENEFITS, CAPABILITIES, COMPARISON, DEVICES, FLOWS, REPLACES, RUNS_ITSELF, YOUR_BRAND } from "@/lib/platform/saas/site";
import { getStandardPlans } from "@/lib/platform/billing/plans";
import { buildShowcase } from "@/lib/platform/billing/showcase";
import SavingsCalculator from "@/components/platform/saas/SavingsCalculator";
import { panelColor } from "@/lib/platform/saas/palette";
import { getFeatureModules } from "@/lib/platform/saas/modules";
import { screenFor } from "@/lib/platform/saas/screens";
import DeviceScene, { type SceneVariant } from "@/components/platform/saas/DeviceScene";
import { FEATURE_LISTS, featureCount } from "@/lib/platform/saas/feature-lists";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import SectionScrollNav from "@/components/platform/saas/SectionScrollNav";
import Reveal from "@/components/platform/saas/Reveal";
import Icon from "@/components/platform/saas/Icon";
import AutomationFlow from "@/components/platform/saas/AutomationFlow";
import ModuleMarquee from "@/components/platform/saas/ModuleMarquee";
import PanelOrbit from "@/components/platform/saas/PanelOrbit";
import PanelShot from "@/components/platform/saas/PanelShot";
import MarketingShot from "@/components/platform/saas/MarketingShot";
import FaqSection from "@/components/platform/saas/FaqSection";
import { productPath, SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";
import StackCompare from "@/components/platform/saas/StackCompare";
import WhyCompare from "@/components/platform/saas/WhyCompare";
import BrandShowcase from "@/components/platform/saas/BrandShowcase";
import ProductShowcase from "@/components/platform/saas/ProductShowcase";
import ScreenGallery from "@/components/platform/saas/ScreenGallery";
import { Journey } from "@/components/platform/saas/Visuals";
import { ChipMarquee, TimelineSteps } from "@/components/platform/saas/Modern";
import CountStats from "@/components/platform/saas/CountStats";
import CapabilityExplorer from "@/components/platform/saas/CapabilityExplorer";
import { SAAS_BRAND } from "@/lib/platform/saas/brand";
import ProductLogo from "@/components/products/ProductLogo";

export const dynamic = "force-dynamic";

const HOME_TITLE = "SelfRun AI: Business Automation for CRM, HR & Finance";
const HOME_DESC = `SelfRun AI is one AI-powered platform with ${SAAS_PRODUCT_COUNT} products for CRM, HR and payroll, accounting, projects, procurement, training and your website. Free to start, every product in every plan.`;
export const metadata: Metadata = {
  ...pageMeta({
    path: "/",
    title: HOME_TITLE,
    description: HOME_DESC,
    keywords: ["business automation software", "AI business automation platform", "CRM software", "HR and payroll software", "accounting and invoicing software", "project management software", "procurement software", "website builder", "AI chatbot for business", "white label business software", "free business software", "all-in-one business management software", "ERP alternative for small business", "software for startups and SMEs"],
    tag: "AI business platform",
  }),
  title: { absolute: HOME_TITLE },
};

/** The real marketing image that goes with each capability area. */
const CAP_SHOT: Record<string, string> = { AI: "intelligence", Automation: "automations", "Your brand": "branding", "Every device": "apps", Control: "workspace-users", "Data & insight": "workspace", "Website & growth": "cms-pages", "People & portals": "hrms" };

const SHOWCASE = ["workspace", "lms", "hrms", "fms", "pms", "prms", "tms", "messenger", "sop", "cms", "smms", "seo", "aibots", "ots"];

export default async function SaasHome() {
  const [modules, plans] = await Promise.all([getFeatureModules(), getStandardPlans().then(buildShowcase).catch(() => [])]);
  const freePlan = plans.find((p) => p.kind === "free");
  const platforms = new Set(DEVICES.flatMap((d) => d.platforms).filter((x) => !["Chrome", "Safari", "Edge", "Firefox"].includes(x))).size;
  const byKey = new Map(modules.map((m) => [m.key, m]));
  const totalFeatures = Object.keys(FEATURE_LISTS).filter((k) => byKey.has(k)).reduce((n, k) => n + featureCount(k), 0);
  const productTabs = SHOWCASE.flatMap((k, i) => {
    const m = byKey.get(k);
    return m && screenFor(k) ? [{ key: k, name: m.name, icon: m.icon, summary: m.summary, points: m.capabilities, node: <DeviceScene screenKey={k} name={m.name} variant={(i % 6) as SceneVariant} /> }] : [];
  });
  const brandTabs = YOUR_BRAND.flatMap((b, i) => (screenFor(b.shot) ? [{ key: b.key, name: b.title, icon: b.icon, summary: b.text, href: "/products#your-brand", node: <DeviceScene screenKey={b.shot} name={b.title} variant={((i + 2) % 6) as SceneVariant} /> }] : []));
  const starter = plans.find((p) => p.id === "starter");
  const SEC = [
    { id: "products", label: "What it is", show: true },
    { id: "why", label: "Why choose it", show: true },
    { id: "benefits", label: "Benefits", show: true },
    { id: "who", label: "Who uses it", show: true },
    { id: "connected", label: "An example", show: true },
    { id: "automation", label: "Automation", show: true },
    { id: "included", label: "What you get", show: true },
    { id: "ai", label: "AI", show: true },
    { id: "screens", label: "See it", show: true },
    { id: "gallery", label: "More screens", show: true },
    { id: "your-brand", label: "Your brand", show: true },
    { id: "devices", label: "Any device", show: true },
    { id: "nolimits", label: "No limits", show: true },
    { id: "comparison", label: "Compare", show: true },
    { id: "cost", label: "Cost", show: !!starter && (starter.offer.monthly ?? 0) > 0 },
    { id: "savings", label: "Savings", show: plans.length > 0 },
    { id: "free", label: "Free to start", show: !!freePlan },
    { id: "trust", label: "Safety", show: true },
    { id: "how", label: "Get started", show: true },
    { id: "faq", label: "FAQs", show: true },
  ].filter((x) => x.show);
  const no = (id: string) => String(SEC.findIndex((x) => x.id === id) + 1).padStart(2, "0");
  const orbit = modules.map((m) => ({ key: m.key, name: m.name, description: m.description, icon: m.icon, color: panelColor(m.key) }));

  return (
    <>
      <JsonLd data={[
        webPage({ path: "/", name: HOME_TITLE, description: HOME_DESC, about: "Business automation software" }),
        softwareApplication({ path: "/", name: "SelfRun AI", description: HOME_DESC, features: ["CRM and lead management", "HR and payroll", "Accounting and invoicing", "Project management", "Procurement", "Training management", "Website builder and CMS", "AI assistants", "Workflow automation", "White-label branding"] }),
        itemList({ name: "SelfRun AI products", items: modules.map((m) => ({ name: m.name, path: productPath(m.key) })) }),, ...(plans.length ? [planOffers(plans.map((p) => ({ id: p.id, name: p.name, description: `${p.name} plan: every product and every feature.`, currency: p.currency, kind: p.kind, monthly: p.offer.monthly })))] : [])]} />
      {/* Hero */}
      <PageHero art="home"
        size="home"
        eyebrow="Business software, made simple"
        title="All the software"
        accent="your business needs, in one place."
        lead={<><span className="font-bold"><span className="text-foreground">SelfRun</span> <span className="text-primary">AI</span></span> is one online system that runs the everyday work of a company: customers and sales, staff and salaries, money and invoices, projects, buying, training and your website. Use it on a phone or a computer, with <b className="text-foreground">your own company name and logo</b> on everything.</>}
        photo="team-desk"
        shot="workspace"
        chip={{ title: "Sale closed", text: "Customer record created · team told — automatically" }}
        notes={["Every feature free to start", "AI built in", "No card needed"]}
      >
        <HeroCtas />
      </PageHero>

      <SectionScrollNav label="Home sections" items={SEC} numbered />

      {/* Proof strip */}
      <section className="relative border-y border-border/50 bg-background/60 backdrop-blur">
        <div className="sr-container">
          <CountStats items={[
            { v: `${SAAS_PRODUCT_COUNT} → 1`, l: "business tools, one subscription" },
            { v: `${totalFeatures}+`, l: "features, all included in every plan" },
            { v: `${platforms}`, l: "devices and systems it works on" },
            { v: "₹0", l: "to start, free forever" },
          ]} />
        </div>
        <div className="pb-8"><ModuleMarquee items={modules.map((m) => ({ key: m.key, name: m.name, icon: m.icon }))} /></div>
      </section>

      {/* Replace the stack */}
      <section id="products" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("products")} center icon="layers" eyebrow="What is SelfRun AI?" title="One system for" accent="every part of your business." lead={`Most companies juggle many different apps: one for customers, one for salaries, one for invoices, one for projects and so on. SelfRun AI gives you all of these as ready-made tools (${SAAS_PRODUCT_COUNT} of them) in one place, so your team stops jumping between apps and re-typing the same information.`} />
          <Reveal>
            <ChipMarquee rows={[
              REPLACES.map((r) => ({ label: r.software, icon: r.icon, struck: true })),
              REPLACES.map((r) => ({ label: byKey.get(r.panel)?.name ?? "Included", icon: r.icon, productKey: r.panel })),
            ]} />
          </Reveal>
          <div className="mt-10 flex justify-center"><Link href="/products" className="sr-btn sr-btn-primary">See all the tools <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      {/* Why SelfRun AI */}
      <section id="why" style={{ scrollMarginTop: 140 }} className="sr-section relative overflow-hidden bg-muted/10">
        <div className="sr-container">
          <SectionHead n={no("why")} center icon="bolt" eyebrow="Why choose SelfRun AI" title="Why businesses" accent="choose it." lead="Because running a company should not mean buying, learning and connecting a dozen different apps." />
          <div className="grid gap-5 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
            <Reveal className="lg:col-span-2 lg:row-span-2">
              <div className="sr-band relative flex h-full min-h-[22rem] flex-col justify-between rounded-[2rem] p-8 shadow-2xl shadow-primary/30 sm:p-10">
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Many apps, one system</p>
                  <p className="mt-3 text-7xl font-black leading-none tracking-tighter sm:text-8xl">{SAAS_PRODUCT_COUNT}<span className="mx-3 text-white/50">→</span>1</p>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">Pick the tools you need, from customers and staff to money and projects. Each tool works on its own, and together they save you time and double work.</p>
                </div>
                <Link href="/products" className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-xl transition-transform hover:scale-105">See all the tools <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
            {[
              { icon: "brain" as const, t: "AI that helps, safely", b: "Ask questions in plain English and get answers from your own records. The AI only shows what that person is allowed to see." },
              { icon: "target" as const, t: "Your brand, not ours", b: "Your logo, your web address, your apps and your notifications. Your team and customers see your company, not SelfRun." },
              { icon: "rocket" as const, t: "Works on every device", b: "Open it in a browser, install it like an app, or get your own apps for Android, iPhone, Windows, Mac and Linux. It is the same data everywhere." },
              { icon: "wallet" as const, t: "Free to start", b: "Every tool and every feature is free to start. You pay only as your team grows." },
            ].map((x, i) => (
              <Reveal key={x.t} delay={(i + 1) * 70}>
                <div className="group relative h-full overflow-hidden rounded-[2rem] border border-border/60 bg-background p-7 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-brand-accent opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
                  <Icon name={x.icon} className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 text-primary/[0.07] transition-transform duration-500 group-hover:scale-110" />
                  <span className="sr-icon mb-4 h-12 w-12 rounded-2xl"><Icon name={x.icon} className="h-5 w-5" /></span>
                  <h3 className="text-lg font-black leading-snug">{x.t}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{x.b}</p>
                </div>
              </Reveal>
            ))}
            <Reveal className="lg:col-span-4">
              <div className="rounded-[2rem] border border-border/60 bg-background p-6 shadow-sm sm:p-8">
                <h3 className="text-xl font-black">The {SAAS_PRODUCT_COUNT} tools, and what each one does</h3>
                <ul className="mt-5 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                  {modules.map((module) => (
                    <li key={module.key} className="flex min-w-0 items-start gap-3 border-t border-border/50 py-4">
                      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center">
                        <ProductLogo productKey={module.key} size={32} className="h-8 w-8 flex-none" title={module.name} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold">{module.name}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{module.summary}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={350} className="lg:col-span-4">
              <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-background to-brand-accent/[0.10] p-8 sm:flex-row sm:items-center sm:p-10">
                <span className="sr-icon h-16 w-16 flex-none rounded-3xl"><Icon name="workflow" className="h-7 w-7" /></span>
                <div className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight">Type it once. The rest follows.</h3>
                  <p className="mt-1.5 max-w-3xl leading-relaxed text-muted-foreground">When a sale is won, the customer record can be created for you. When a project step is done, the invoice can be raised. When an invoice is paid, your accounts can be updated. You choose which of these steps happen automatically, and every run is recorded.</p>
                </div>
                <Link href={productPath("workspace")} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105">See how it works <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Why an AI-powered business */}
      <section id="benefits" style={{ scrollMarginTop: 140 }} className="sr-section">
        <div className="sr-container">
          <SectionHead n={no("benefits")} center icon="brain" eyebrow="The benefits" title="More time," accent="fewer mistakes." lead="Most of the working day goes into chasing people, copying data between apps and building reports. SelfRun AI takes care of that, so you can focus on your customers and your growth." />
          <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative">
            <MarketingShot screenKey="fms" name="SelfRun CashFlow AI" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/30 bg-black/45 p-5 text-white backdrop-blur-xl sm:inset-x-8 sm:bottom-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Ask in plain English</p>
              <p className="mt-1 text-lg font-bold">“Which invoices are more than 30 days overdue?”</p>
              <p className="mt-1 text-sm text-white/80">You get the answer from your own records, and you can see how it was worked out.</p>
            </div>
          </Reveal>
          <div>
            <div className="grid gap-6 sm:grid-cols-2">
              {AI_BENEFITS.map((b, i) => (
                <Reveal key={b.title} delay={(i % 2) * 80} className="flex gap-4">
                  <span className="sr-icon h-11 w-11 flex-none"><Icon name={b.icon} className="h-5 w-5" /></span>
                  <span><span className="block font-bold">{b.title}</span><span className="block text-sm leading-relaxed text-muted-foreground">{b.text}</span></span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Who it is for */}
      <section id="who" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("who")} center icon="building" eyebrow="Who uses it" title="See how it fits" accent="your business." lead="Different kinds of businesses use SelfRun AI in different ways. Find yours and see what it helps with." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((x, i) => (
              <Reveal key={x.slug} delay={(i % 3) * 60}>
                <div className="group h-full rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-accent text-sm font-black text-white shadow-md shadow-primary/25">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-black leading-snug">{x.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.summary}</p>
                  <ul className="mt-4 space-y-2">{x.needs.slice(0, 3).map((n) => <li key={n} className="flex gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" strokeWidth={3} />{n}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex justify-center"><Link href="/success-stories" className="sr-btn sr-btn-primary">See how it works in practice <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      {/* Connected */}
      <section id="connected" style={{ scrollMarginTop: 140 }} className="sr-section bg-muted/10">
        <div className="sr-container">
          <SectionHead n={no("connected")} center icon="chart" eyebrow="A real example" title="From first enquiry" accent="to money in the bank." lead="Follow one customer through your business: they enquire, you win the deal, you do the work, you send the invoice and you get paid. Normally that touches five different apps. Here, nobody has to re-type anything." />
          <Journey
            steps={[
              { label: "Enquiry received", text: "From your website, forms and campaigns.", module: "SelfRun DealFlow AI", productKey: "lms", icon: "target" },
              { label: "Deal won", text: "The customer record is created for you.", module: "SelfRun DealFlow AI", productKey: "lms", icon: "check" },
              { label: "Project delivered", text: "Tasks, hours worked and milestones are tracked.", module: "SelfRun SprintOS", productKey: "pms", icon: "layers" },
              { label: "Invoice sent", text: "Created from the milestone, with a payment link.", module: "SelfRun CashFlow AI", productKey: "fms", icon: "wallet" },
              { label: "Paid and recorded", text: "Your finance team is told and the accounts are updated.", module: "SelfRun CashFlow AI", productKey: "fms", icon: "chart" },
            ]}
          />
        </div>
      </section>

      {/* How the whole business runs itself */}
      <section id="automation" className="sr-section relative overflow-hidden" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("automation")} center icon="workflow" eyebrow="Automation" title="Routine work" accent="that does itself." lead="You set the rules once. After that, the system follows up, reminds people, asks for approvals and reports, so nothing waits for someone to remember." />
          <TimelineSteps items={RUNS_ITSELF.map((l) => ({ title: l.title, text: l.text, icon: l.icon, points: l.points }))} />
          <div className="mt-20 grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
            <Reveal><AutomationFlow flows={FLOWS} /></Reveal>
            <Reveal delay={120}><MarketingShot screenKey="automations" name="Automations" /></Reveal>
          </div>
        </div>
      </section>

      {/* Everything included */}
      <section id="included" className="sr-section relative overflow-hidden bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("included")} center icon="bolt" eyebrow="What you get" title="Everything below" accent="is included." lead="These are not extras. Every plan, even the free one, includes all of it from day one." />
          <Reveal><CapabilityExplorer items={CAPABILITIES.map((c) => ({ title: c.title, icon: c.icon, items: c.items, media: CAP_SHOT[c.title] ? <MarketingShot screenKey={CAP_SHOT[c.title]} name={c.title} /> : undefined }))} /></Reveal>
        </div>
      </section>

      {/* AI first */}
      <section id="ai" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("ai")} center icon="bot" eyebrow="AI that helps" title="AI that helps" accent="with real work." lead="Not just a chatbot added on the side. The AI reads your own records, writes content, answers your customers and works inside your automations, and it only shows each person what they are allowed to see." />
          <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              {AI_CAPABILITIES.map((c, i) => (
                <Reveal key={c.title} delay={(i % 2) * 80} className="flex gap-4">
                  <span className="sr-icon h-11 w-11 flex-none"><Icon name={c.icon} className="h-5 w-5" /></span>
                  <span><span className="block font-bold">{c.title}</span><span className="block text-sm leading-relaxed text-muted-foreground line-clamp-3">{c.body}</span></span>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal className="space-y-6">
            <MarketingShot screenKey="intelligence" name="SelfRun DataBrain AI" />
            <div className="grid grid-cols-2 gap-4">
              <PanelShot moduleKey="aibots" name="SelfRun AgentOS" glow={false} />
              <PanelShot moduleKey="chatbot" name="AI Chatbot" glow={false} />
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* See the product */}
      <section id="screens" className="sr-band sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container relative">
          <SectionHead n={no("screens")} tone="dark" center icon="chart" eyebrow="See it" title="Real screens from" accent="the live product." lead="These are screenshots of the real product with sample data in it. Pick a tool and look around." />
          <ProductShowcase items={productTabs} />
        </div>
      </section>

      {/* More screens, in every device */}
      <section id="gallery" style={{ scrollMarginTop: 140 }} className="sr-section">
        <div className="sr-container">
          <SectionHead n={no("gallery")} center icon="layers" eyebrow="A closer look" title="More real screens," accent="in full detail." lead="Leads, invoices, people, projects, search rankings and your website, captured from the live product, not drawn." />
          <ScreenGallery />
        </div>
      </section>

      {/* White label */}
      <section id="your-brand" className="sr-section relative overflow-hidden" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("your-brand")} center icon="target" eyebrow="Your brand" title="Your company's name" accent="everywhere." lead="Your team, your customers and your website visitors see your company: your logo, your web address, your apps and your notifications. SelfRun stays out of sight." />
          {brandTabs.length > 0 && <BrandShowcase brand={SAAS_BRAND.name} items={brandTabs.map((t) => ({ key: t.key, title: t.name, text: t.summary, icon: t.icon, node: t.node }))} />}
        </div>
      </section>

      {/* Every device */}
      <section id="devices" className="sr-section relative overflow-hidden bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("devices")} center icon="rocket" eyebrow="Any device" title="Use it anywhere," accent="on any device." lead="In a web browser, on a phone or on a computer. Every app shows your company's name, icon and colours, and can send notifications." />
          <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="space-y-4 border-b border-border/70 pb-4">
              {DEVICES.map((d, i) => (
                <Reveal key={d.title} delay={i * 70} className="border-t border-border/70 pb-2 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold">{d.title}</h3>
                    <div className="flex flex-wrap gap-1.5">{d.platforms.map((p) => <span key={p} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{p}</span>)}</div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal><MarketingShot screenKey="apps" name="Apps & downloads" /></Reveal>
        </div>
        </div>
      </section>

      {/* No limits: every product */}
      <section id="nolimits" style={{ scrollMarginTop: 140 }} className="sr-section relative overflow-hidden bg-muted/10">
        <div className="pointer-events-none absolute right-0 top-1/3 h-[700px] w-[700px] translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="sr-container relative">
          <SectionHead n={no("nolimits")} center icon="layers" eyebrow="No locked features" title="Every tool. Every feature." accent="In every plan." lead={`${SAAS_PRODUCT_COUNT} tools and ${totalFeatures}+ features: customers, staff, payroll, money, projects, buying, training, documents, website, AI and more. Nothing is hidden behind a higher plan. Plans differ only by team size and usage limits.`} />
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-1">
              {modules.slice(0, SAAS_PRODUCT_COUNT).map((module) => (
                <li key={module.key} className="flex gap-3 text-sm leading-relaxed">
                  <span className="sr-circle mt-0.5 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span>
                  <span><strong>{module.name}:</strong> {module.capabilities[0] ?? module.summary}</span>
                </li>
              ))}
            </ul>
            <Link href="/products" className="sr-btn sr-btn-primary mt-8">See every feature <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <Reveal><PanelOrbit panels={orbit} brand={SAAS_BRAND.name} /></Reveal>
        </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" style={{ scrollMarginTop: 140 }} className="sr-section">
        <div className="sr-container">
          <SectionHead n={no("comparison")} center icon="shield" eyebrow="Compare" title="SelfRun AI vs." accent="many separate apps." lead="Most businesses use a different app for every job. Here is what changes when it all lives in one AI-powered system." />
          <WhyCompare rows={COMPARISON} brand={SAAS_BRAND.name} />
        </div>
      </section>

      {/* The same jobs, priced on separate tools */}
      {(() => {
        const st = plans.find((p) => p.id === "starter");
        const m = (st?.offer.monthly ?? 0) / 100;
        return st && m > 0 ? (
          <section id="cost" style={{ scrollMarginTop: 140 }} className="sr-section bg-gradient-to-b from-muted/20 to-transparent">
            <div className="sr-container">
              <SectionHead n={no("cost")} center icon="wallet" eyebrow="What it costs" title="Sixteen tools. Sixteen bills." accent="Or one plan." lead="Add up what a team of ten pays for chat, HR, customer management, projects, accounting, purchasing, training, tests, a website, search ranking, social media, AI, file storage, a policy wiki and a help desk. Then compare it with SelfRun." />
              <StackCompare plan={{ name: st.name, price: `₹${m.toLocaleString("en-IN")}`, monthly: m }} products={modules} />
            </div>
          </section>
        ) : null;
      })()}

      {/* Savings */}
      {plans.length > 0 && (
        <section id="savings" style={{ scrollMarginTop: 140 }} className="sr-band sr-section">
          <div className="sr-container relative">
            <SectionHead n={no("savings")} tone="dark" center icon="wallet" eyebrow="Savings" title="What would you save?" accent="Try your own numbers." lead="Fewer subscriptions, fewer logins and less admin work for your people. Move the sliders to match your business." />
            <Reveal><SavingsCalculator plans={plans} /></Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { t: "Fewer subscriptions", b: "One bill instead of a separate app for every department, and every feature is already included.", icon: "wallet" as const },
                { t: "Less admin work", b: "Reminders, follow-ups, approvals and reports run on their own, so your team spends its time on customers instead of chasing.", icon: "users" as const },
                { t: "Automate the steps you choose", b: "Set up the connections you want between tools and services. Each tool also works fine on its own.", icon: "plug" as const },
              ].map((x, i) => (
                <Reveal key={x.t} delay={i * 80}>
                  <div className="sr-glass relative h-full overflow-hidden p-7">
                    <span className="pointer-events-none absolute -right-2 -top-5 select-none text-8xl font-black text-white/[0.07]" aria-hidden>0{i + 1}</span>
                    <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Icon name={x.icon} className="h-5 w-5" /></span>
                    <h3 className="mb-2 text-lg font-black">{x.t}</h3>
                    <p className="text-sm leading-relaxed text-white/75">{x.b}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Free forever */}
      {freePlan && (
        <section id="free" style={{ scrollMarginTop: 140 }} className="sr-section">
          <div className="sr-container">
            <SectionHead n={no("free")} icon="wallet" eyebrow="Free to start" title="Every tool. Every feature." accent="₹0, forever." lead="All the tools and all the features are free. This is not a trial that runs out. Start using it today and pay only when your team grows." />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-background p-8 shadow-2xl sm:p-14">
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-accent/15 blur-3xl" />
              <div className="relative space-y-8">
                <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                  {[`${SAAS_PRODUCT_COUNT} tools and ${totalFeatures}+ features`, "AI and automation included", "Your own brand, web address and apps", ...freePlan.limits.filter((l) => l.included).slice(0, 3).map((l) => `${l.label}: ${l.value}`), "No card needed"].map((t) => (
                    <li key={t} className="flex items-center gap-3 border-b border-border/50 py-3.5 text-[15px] font-semibold"><span className="sr-circle h-6 w-6"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}</li>
                  ))}
                </ul>
                <div className="flex justify-center"><HeroCtas primary={{ label: "Start free forever", href: "/signup" }} secondary={{ label: "Compare plans", href: "/pricing" }} /></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Security */}
      <section id="trust" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n={no("trust")} center icon="shield" eyebrow="Safety" title="Safe by design," accent="yours by default." lead="Your data is kept separate from every other company's. People only see what their role allows. The AI only sees what the person asking is allowed to see." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SECURITY_POINTS.slice(0, 6).map((x, i) => (
              <Reveal key={x.title} delay={(i % 3) * 60}>
                <div className="flex h-full gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-sm"><span className="sr-icon h-12 w-12 flex-none"><Icon name={x.icon} className="h-5 w-5" /></span><span><span className="block font-black leading-snug">{x.title}</span><span className="mt-1 block text-[15px] leading-relaxed text-muted-foreground">{x.body}</span></span></div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold">
            <Link href="/security" className="text-primary hover:underline">Security and trust</Link>
            <Link href="/vision" className="text-primary hover:underline">Our product vision</Link>
            <Link href="/roadmap" className="text-primary hover:underline">What is available today</Link>
            <Link href="/status" className="text-primary hover:underline">Live status</Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ scrollMarginTop: 140 }} className="sr-section">
        <div className="sr-container">
          <SectionHead n={no("how")} center icon="rocket" eyebrow="Getting started" title="Ready in minutes," accent="not months." lead="Four simple steps from sign-up to running your business on it." />
          <TimelineSteps items={HOW_IT_WORKS.map((x) => ({ title: x.title, text: x.body }))} />
          <div className="mt-16 flex justify-center"><HeroCtas primary={{ label: "Get started free", href: "/signup" }} secondary={{ label: "See it with your scenario", href: "/demo" }} /></div>
        </div>
      </section>

      <CtaBand />

      <FaqSection n={no("faq")} topics={["General", "Plans & pricing", "Setup", "Your brand"]} limit={7} />
    </>
  );
}
