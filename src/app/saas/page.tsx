import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AI_CAPABILITIES, HOW_IT_WORKS } from "@/lib/saas/content";
import { AI_BENEFITS, CAPABILITIES, COMPARISON, DEVICES, FLOWS, REPLACES, RUNS_ITSELF, YOUR_BRAND } from "@/lib/saas/site";
import { getStandardPlans } from "@/lib/platform/billing/plans";
import { buildShowcase } from "@/lib/platform/billing/showcase";
import SavingsCalculator from "@/components/saas/SavingsCalculator";
import { panelColor } from "@/lib/saas/palette";
import { getFeatureModules } from "@/lib/saas/modules";
import { screenFor } from "@/lib/saas/screens";
import DeviceScene, { type SceneVariant } from "@/components/saas/DeviceScene";
import { FEATURE_LISTS, featureCount } from "@/lib/saas/feature-lists";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/saas/blocks";
import Reveal from "@/components/saas/Reveal";
import Icon from "@/components/saas/Icon";
import AutomationFlow from "@/components/saas/AutomationFlow";
import ModuleMarquee from "@/components/saas/ModuleMarquee";
import PanelOrbit from "@/components/saas/PanelOrbit";
import PanelShot from "@/components/saas/PanelShot";
import MarketingShot from "@/components/saas/MarketingShot";
import FaqSection from "@/components/saas/FaqSection";
import WhyCompare from "@/components/saas/WhyCompare";
import BrandShowcase from "@/components/saas/BrandShowcase";
import ProductShowcase from "@/components/saas/ProductShowcase";
import ScreenGallery from "@/components/saas/ScreenGallery";
import { Journey } from "@/components/saas/Visuals";
import { ChipMarquee, TimelineSteps } from "@/components/saas/Modern";
import CountStats from "@/components/saas/CountStats";
import CapabilityExplorer from "@/components/saas/CapabilityExplorer";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const dynamic = "force-dynamic";

/** The real marketing image that goes with each capability area. */
const CAP_SHOT: Record<string, string> = { AI: "intelligence", Automation: "automations", "Your brand": "branding", "Every device": "apps", Control: "workspace-users", "Data & insight": "workspace", "Website & growth": "cms-pages", "People & portals": "hrms" };

const SHOWCASE = ["workspace", "lms", "hrms", "fms", "pms", "prms", "tms", "messenger", "sop", "cms", "smms", "seo", "aibots", "ots"];

export default async function SaasHome() {
  const [modules, plans] = await Promise.all([getFeatureModules(), getStandardPlans().then(buildShowcase).catch(() => [])]);
  const freePlan = plans.find((p) => p.kind === "free");
  const platforms = new Set(DEVICES.flatMap((d) => d.platforms).filter((x) => !["Chrome", "Safari", "Edge", "Firefox"].includes(x))).size;
  const byKey = new Map(modules.map((m) => [m.key, m]));
  const totalFeatures = Object.keys(FEATURE_LISTS).filter((k) => byKey.has(k)).reduce((n, k) => n + featureCount(k), 0);
  const panelTabs = SHOWCASE.flatMap((k, i) => {
    const m = byKey.get(k);
    return m && screenFor(k) ? [{ key: k, name: m.name, icon: m.icon, summary: m.summary, points: m.capabilities, node: <DeviceScene screenKey={k} name={m.name} variant={(i % 6) as SceneVariant} /> }] : [];
  });
  const brandTabs = YOUR_BRAND.flatMap((b, i) => (screenFor(b.shot) ? [{ key: b.key, name: b.title, icon: b.icon, summary: b.text, href: "/features#your-brand", node: <DeviceScene screenKey={b.shot} name={b.title} variant={((i + 2) % 6) as SceneVariant} /> }] : []));
  const orbit = modules.map((m) => ({ key: m.key, name: m.name, description: m.description, icon: m.icon, color: panelColor(m.key) }));

  return (
    <>
      {/* Hero */}
      <PageHero art="home"
        size="home"
        eyebrow="The AI-powered business automation platform"
        title="One software."
        accent="Your entire business, automated."
        lead={<><span className="font-bold"><span className="text-foreground">SelfRun</span> <span className="text-primary">AI</span></span> replaces your CRM, HR, payroll, accounting, projects, website and {REPLACES.length - 6} more tools with one AI-powered platform — on web, Android, iOS, Windows, macOS and Linux, all under <b className="text-foreground">your own brand</b>.</>}
        photo="team-desk"
        shot="workspace"
        chip={{ title: "Deal won", text: "Client created · team notified — automatically" }}
        notes={["Free forever for one person", "No card needed", "Every feature included"]}
      >
        <HeroCtas />
      </PageHero>

      {/* Proof strip */}
      <section className="relative border-y border-border/50 bg-background/60 backdrop-blur">
        <div className="sr-container">
          <CountStats items={[
            { v: `${REPLACES.length} → 1`, l: "kinds of software, one subscription" },
            { v: `${totalFeatures}+`, l: "features — all on every plan" },
            { v: `${platforms}`, l: "platforms, your own apps" },
            { v: "₹0", l: "forever for one person" },
          ]} />
        </div>
        <div className="pb-8"><ModuleMarquee items={modules.map((m) => ({ name: m.name, icon: m.icon }))} /></div>
      </section>

      {/* Replace the stack */}
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="layers" eyebrow="One software, every tool" title={`${REPLACES.length} kinds of software.`} accent="One subscription." lead="Stop paying for, logging into and copying data between a different tool for every job. Each one below is a full panel inside SelfRun — sharing one database, one login and one bill." />
          <Reveal>
            <ChipMarquee rows={[
              REPLACES.map((r) => ({ label: r.software, icon: r.icon, struck: true })),
              REPLACES.map((r) => ({ label: byKey.get(r.panel)?.name ?? "Included", icon: r.icon })),
            ]} />
          </Reveal>
          <div className="mt-10 flex justify-center"><Link href="/features" className="sr-btn sr-btn-primary">See every panel <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>


      {/* Everything included */}
      <section className="sr-section relative overflow-hidden bg-muted/10">
        <div className="sr-container">
          <SectionHead center icon="bolt" eyebrow="Everything included" title="All of this," accent="from day one." lead="Not add-ons. Not a higher tier. Every capability below comes with every plan — including free." />
          <Reveal><CapabilityExplorer items={CAPABILITIES.map((c) => ({ title: c.title, icon: c.icon, items: c.items, media: CAP_SHOT[c.title] ? <MarketingShot screenKey={CAP_SHOT[c.title]} name={c.title} /> : undefined }))} /></Reveal>
        </div>
      </section>

      {/* How the whole business runs itself */}
      <section className="sr-section relative overflow-hidden">
        <div className="sr-container">
          <SectionHead center icon="workflow" eyebrow="Fully automated" title="How your entire business" accent="runs itself." lead="Work enters once, flows through every panel on its own, and the platform follows up, approves, reminds and reports — while AI turns it all into answers." />
          <TimelineSteps items={RUNS_ITSELF.map((l) => ({ title: l.title, text: l.text, icon: l.icon, points: l.points }))} />
          <div className="mt-20 grid items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
            <Reveal><AutomationFlow flows={FLOWS} /></Reveal>
            <Reveal delay={120}><MarketingShot screenKey="automations" name="Automations" /></Reveal>
          </div>
        </div>
      </section>

      {/* Savings */}
      {plans.length > 0 && (
        <section className="sr-band sr-section">
          <div className="sr-container relative">
            <SectionHead tone="dark" center icon="wallet" eyebrow="Cut your costs" title="What would you save?" accent="Do the maths." lead="Fewer subscriptions, fewer logins, and far less admin work for your people. Move the sliders to your own numbers." />
            <Reveal><SavingsCalculator plans={plans} /></Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { t: "Fewer subscriptions", b: "One bill replaces a tool for every department — and every feature is already included.", icon: "wallet" as const },
                { t: "Less admin, fewer hires for it", b: "Reminders, follow-ups, approvals and reports run on their own, so your team grows the business instead of chasing it.", icon: "users" as const },
                { t: "No integration costs", b: "Every panel shares one database, so there are no connectors to buy, build or fix.", icon: "plug" as const },
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

      {/* Every device */}
      <section className="sr-section relative overflow-hidden bg-muted/10">
        <div className="sr-container">
          <SectionHead center icon="rocket" eyebrow="Every device" title="Your own apps," accent="on every device." lead="One workspace, everywhere your people are — in the browser, on their phones and on their computers. Every app carries your company's name, icon and colours, with push notifications." />
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

      {/* Free forever */}
      {freePlan && (
        <section className="sr-section">
          <div className="sr-container">
            <SectionHead icon="wallet" eyebrow="Free forever" title="Every panel. Every feature." accent="₹0, forever." lead={`${freePlan.description} Not a trial that runs out — start running your business today, and pay only when your team grows.`} />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-background p-8 shadow-2xl sm:p-14">
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-brand-accent/15 blur-3xl" />
              <div className="relative space-y-8">
                <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                  {[`${modules.length} panels and ${totalFeatures}+ features`, "AI and automation included", "Your own brand, domain and apps", ...freePlan.limits.filter((l) => l.included).slice(0, 3).map((l) => `${l.label}: ${l.value}`), "No card needed"].map((t) => (
                    <li key={t} className="flex items-center gap-3 border-b border-border/50 py-3.5 text-[15px] font-semibold"><span className="sr-circle h-6 w-6"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}</li>
                  ))}
                </ul>
                <div className="flex justify-center"><HeroCtas primary={{ label: "Start free forever", href: "/signup" }} secondary={{ label: "Compare plans", href: "/pricing" }} /></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why an AI-powered business */}
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="brain" eyebrow="The benefits" title="Stop running your business." accent="Let it run itself." lead="Most of a company's day goes on chasing, copying and reporting. Give that to the platform — and spend your time on customers and growth." />
          <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative">
            <MarketingShot screenKey="fms" name="Finance" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/30 bg-black/45 p-5 text-white backdrop-blur-xl sm:inset-x-8 sm:bottom-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Ask your business</p>
              <p className="mt-1 text-lg font-bold">“Which invoices are more than 30 days overdue?”</p>
              <p className="mt-1 text-sm text-white/80">Answered from your real records — with the working shown.</p>
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

      {/* No limits: every panel */}
      <section className="sr-section relative overflow-hidden bg-muted/10">
        <div className="pointer-events-none absolute right-0 top-1/3 h-[700px] w-[700px] translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="sr-container relative">
          <SectionHead center icon="layers" eyebrow="No limits" title="Every panel. Every feature." accent="On every plan." lead={`${modules.length} panels and ${totalFeatures}+ features — CRM, HR, payroll, finance, projects, procurement, training, documents, website, AI and more. Nothing is locked behind a higher tier: plans differ only by team size and allowances.`} />
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <ul className="space-y-3">
              {["Switch on only what you need — add the rest any time", "Every panel shares one database and one login", "AI and automation work across all of them"].map((t) => (
                <li key={t} className="flex gap-3 text-[15px]"><span className="sr-circle mt-0.5 h-5 w-5"><Check className="h-3 w-3" strokeWidth={3} /></span>{t}</li>
              ))}
            </ul>
            <Link href="/features" className="sr-btn sr-btn-primary mt-8">See every feature <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <Reveal><PanelOrbit panels={orbit} brand={SAAS_BRAND.name} /></Reveal>
        </div>
        </div>
      </section>

      {/* White label */}
      <section id="your-brand" className="sr-section relative overflow-hidden">
        <div className="sr-container">
          <SectionHead center icon="target" eyebrow="White label" title="Your brand everywhere." accent="Not ours." lead="Your team, your clients and your visitors see your company — your logo, your domain, your apps, your notifications. SelfRun stays in the background." />
          {brandTabs.length > 0 && <BrandShowcase brand={SAAS_BRAND.name} items={brandTabs.map((t) => ({ key: t.key, title: t.name, text: t.summary, icon: t.icon, node: t.node }))} />}
        </div>
      </section>

      {/* See the product */}
      <section className="sr-band sr-section">
        <div className="sr-container relative">
          <SectionHead tone="dark" center icon="chart" eyebrow="See the product" title="Real screens from" accent="the live product." lead="Every panel your team will work in — with data in it. Pick one and look around." />
          <ProductShowcase items={panelTabs} />
        </div>
      </section>

      {/* More screens, in every device */}
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="layers" eyebrow="Inside the product" title="More real screens," accent="in full detail." lead="Leads, invoices, people, projects, rankings and your website — captured from the live product, not drawn." />
          <ScreenGallery />
        </div>
      </section>

      {/* AI first */}
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="bot" eyebrow="AI first" title="AI in every corner" accent="of your business." lead="Not a chatbot bolted on. AI reads your live records, writes your content, answers your customers and works inside your automations — always within each person's permissions." />
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
            <MarketingShot screenKey="intelligence" name="AI Intelligence" />
            <div className="grid grid-cols-2 gap-4">
              <PanelShot moduleKey="aibots" name="AI Assistants" glow={false} />
              <PanelShot moduleKey="chatbot" name="AI Chatbot" glow={false} />
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* Why SelfRun AI */}
      <section className="sr-section relative overflow-hidden bg-muted/10">
        <div className="sr-container">
          <SectionHead center icon="bolt" eyebrow="Why SelfRun AI" title="One platform that" accent="runs your business." lead="Six reasons companies put everything on one AI-powered platform instead of a stack of separate tools." />
          <div className="grid gap-5 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
            <Reveal className="lg:col-span-2 lg:row-span-2">
              <div className="sr-band relative flex h-full min-h-[22rem] flex-col justify-between rounded-[2rem] p-8 shadow-2xl shadow-primary/30 sm:p-10">
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">One platform</p>
                  <p className="mt-3 text-7xl font-black leading-none tracking-tighter sm:text-8xl">{REPLACES.length}<span className="mx-3 text-white/50">→</span>1</p>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">{modules.length} panels on one login and one database replace {REPLACES.length} kinds of separate software — and every feature is on every plan.</p>
                </div>
                <Link href="/features" className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-xl transition-transform hover:scale-105">See every panel <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
            {[
              { icon: "brain" as const, t: "AI that respects permissions", b: "It reads your live records, writes your content and works inside your automations — always within each person's access, and showing its working." },
              { icon: "target" as const, t: "Your brand, not ours", b: "Your logo, domain, apps and notifications — SelfRun stays in the background for your team, clients and visitors." },
              { icon: "rocket" as const, t: "Every device", b: "Web, an installable app, Android, iOS, Windows, macOS and Linux — the same workspace everywhere." },
              { icon: "wallet" as const, t: "Free forever to start", b: "Every panel and every feature for one person. Pay only when your team grows." },
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
            <Reveal delay={350} className="lg:col-span-4">
              <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-background to-brand-accent/[0.10] p-8 sm:flex-row sm:items-center sm:p-10">
                <span className="sr-icon h-16 w-16 flex-none rounded-3xl"><Icon name="workflow" className="h-7 w-7" /></span>
                <div className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight">Work enters once and runs itself</h3>
                  <p className="mt-1.5 max-w-3xl leading-relaxed text-muted-foreground">A deal won creates the client, a finished milestone raises the invoice, a paid invoice updates the ledger — reminders, approvals and hand-offs happen across panels on their own, and every run is logged.</p>
                </div>
                <Link href="/features/workspace" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105">See automations <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="shield" eyebrow="Why switch" title="SelfRun AI vs." accent="a stack of separate tools." lead="Most businesses run on a separate tool for every job. Here is everything that changes when it is all one AI-powered platform." />
          <WhyCompare rows={COMPARISON} brand={SAAS_BRAND.name} />
        </div>
      </section>

      {/* Connected */}
      <section className="sr-section bg-muted/10">
        <div className="sr-container">
          <SectionHead center icon="chart" eyebrow="Connected by design" title="From first enquiry" accent="to money in the ledger." lead="A deal won starts the project. A finished milestone raises the invoice. A paid invoice updates the books. Nobody re-types a thing." />
          <Journey
            steps={[
              { label: "Lead captured", text: "From your website, forms and campaigns.", module: "lms", icon: "target" },
              { label: "Deal won", text: "The client record is created for you.", module: "lms", icon: "check" },
              { label: "Project delivered", text: "Tasks, timesheets and milestones.", module: "pms", icon: "layers" },
              { label: "Invoice raised", text: "From the milestone, with a payment link.", module: "fms", icon: "wallet" },
              { label: "Paid & posted", text: "Finance is told; the ledger is updated.", module: "fms", icon: "chart" },
            ]}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="sr-section">
        <div className="sr-container">
          <SectionHead center icon="rocket" eyebrow="How it works" title="Live in minutes," accent="not months." />
          <TimelineSteps items={HOW_IT_WORKS.map((x) => ({ title: x.title, text: x.body }))} />
          <div className="mt-16 flex justify-center"><HeroCtas primary={{ label: "Get started free", href: "/signup" }} secondary={{ label: "See it with your scenario", href: "/demo" }} /></div>
        </div>
      </section>

      <CtaBand />

      <FaqSection topics={["General", "Plans & pricing", "Setup", "Your brand"]} limit={7} />
    </>
  );
}
