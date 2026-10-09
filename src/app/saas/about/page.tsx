import FaqSection from "@/components/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { INDUSTRIES, SECURITY_POINTS, USE_CASES } from "@/lib/saas/content";
import { GROWTH, STORIES } from "@/lib/saas/site";
import { getFeatureGroups } from "@/lib/saas/modules";
import { panelColor } from "@/lib/saas/palette";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/saas/blocks";
import Icon from "@/components/saas/Icon";
import { IconColumns, NumberedRows } from "@/components/saas/Modern";
import CountStats from "@/components/saas/CountStats";
import Reveal from "@/components/saas/Reveal";
import MarketingShot from "@/components/saas/MarketingShot";
import PanelOrbit from "@/components/saas/PanelOrbit";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "About Us",
  description: "Who we are, our mission, what SelfRun AI does, how companies grow on it and the scenarios it automates — on one page.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { title: "Built for every business", body: "We design for the many companies that use the platform, never for one special case. If one customer needs something, it becomes a feature everyone can use.", icon: "building" as const },
  { title: "Automation with accountability", body: "Automation is only useful if you can trust it. Every automated action is logged, explained and under your control — and people stay in the loop wherever a decision matters.", icon: "workflow" as const },
  { title: "Your data stays yours", body: "Strict isolation between companies, roles and permissions per action, encrypted secrets, and the ability to export your data at any time.", icon: "lock" as const },
  { title: "Simple on the surface", body: "Powerful software should still be easy to start with. Guided setup, sensible defaults and one consistent design across every panel.", icon: "bolt" as const },
  { title: "Your brand, not ours", body: "Every company runs the platform under its own name — logo, colours, domain, emails and apps. SelfRun stays in the background.", icon: "target" as const },
  { title: "Honest by default", body: "We describe the product as it is. Where there is no customer story to share yet, we say so rather than invent one.", icon: "check" as const },
];

const PRINCIPLES = [
  { title: "Take the repetitive work off people", body: "Copying data between tools, chasing approvals and compiling reports should be the platform's job, so people spend their time on customers, craft and growth." },
  { title: "One source of truth", body: "Every panel shares one record of the business, so a number means the same thing wherever you see it." },
  { title: "Automation people can trust", body: "Every run is logged and explained, workflows can be paused at any time, and approvals keep people in control of anything that moves money." },
  { title: "Intelligence with permission", body: "AI answers from your real records, shows how it got there, and only sees what the person asking is allowed to see." },
];

const NAV = [
  { id: "about", label: "About us" },
  { id: "mission", label: "Our mission" },
  { id: "what-we-do", label: "What we do" },
  { id: "growth", label: "How you grow" },
  { id: "stories", label: "Success stories" },
  { id: "values", label: "Our values" },
];

export default async function AboutPage() {
  const groups = await getFeatureGroups();
  const modules = groups.flatMap((g) => g.items);
  const orbit = modules.map((m) => ({ key: m.key, name: m.name, description: m.description, icon: m.icon, color: panelColor(m.key) }));
  return (
    <>
      <PageHero art="about"
        eyebrow="About SelfRun AI"
        title="We believe a business"
        accent="should run itself."
        lead="Too many companies spend their best hours copying data between tools, chasing approvals and compiling reports. SelfRun AI exists to take that work off people's plates — with one AI-powered platform that runs the routine."
        photo="open-office"
        shot="workspace"
        shotName="Workspace"
        chip={{ title: `${modules.length} panels, one platform`, text: "Under your own brand" }}
      >
        <HeroCtas primary={{ label: "Get started free", href: "/signup" }} secondary={{ label: "Contact us", href: "/contact" }} />
      </PageHero>

      <nav aria-label="On this page" className="sticky top-[76px] z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="sr-container sr-scroll-x flex gap-1.5 py-3">
          {NAV.map((n) => <a key={n.id} href={`#${n.id}`} className="sr-tab shrink-0">{n.label}</a>)}
        </div>
      </nav>

      {/* About us */}
      <section id="about" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead center icon="building" eyebrow="About us" title="One platform for" accent="the whole company." />
          <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="sr-prose">
              <p>{SAAS_BRAND.name} combines the systems a company normally buys separately — CRM, HR and payroll, finance, projects, procurement, training, documents, a website builder, team chat and more — on one database with one set of permissions.</p>
              <p>On top of that sits AI that answers questions from your own records, shows its working and respects who is asking, and a workflow engine that acts on events across the whole platform: a won deal creates the client, a completed milestone raises the invoice, a paid invoice updates the ledger.</p>
              <p>The platform is multi-tenant by design. Every company is a customer of the same product, with the same features, the same onboarding and the same safeguards. There is no special version for anyone — and every company runs it under its own brand, on the web, as an installable app, on Android and iOS and on the desktop.</p>
            </div>
            <div className="mt-8 border-t border-border/60"><CountStats items={[{ v: String(modules.length), l: "panels" }, { v: "1", l: "login" }, { v: "1", l: "database" }]} /></div>
          </div>
          <Reveal><MarketingShot screenKey="workspace" name="Workspace" /></Reveal>
        </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="sr-section relative overflow-hidden bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead center icon="target" eyebrow="Our mission" title="Give every business a platform" accent="that runs the routine." lead="From a ten-person firm to a growing enterprise: one intelligent system that handles the repetitive parts of running a company, so people can focus on what only people can do — customers, craft and growth." />
          <NumberedRows items={PRINCIPLES.map((p) => ({ title: p.title, text: p.body }))} />
        </div>
      </section>

      {/* What we do */}
      <section id="what-we-do" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead center icon="layers" eyebrow="What we do" title="Seven areas of your business," accent="one platform." lead="We build and run the platform your company works in. Each area below is a set of panels — all included in every plan." />
          <div className="mb-20 grid items-center gap-12 lg:grid-cols-2">
            <Reveal><PanelOrbit panels={orbit} brand={SAAS_BRAND.name} /></Reveal>
            <ul className="space-y-6">
              {groups.map((g, i) => (
                <Reveal key={g.id} as="li" delay={i * 50}>
                  <Link href={`/features#${g.id}`} className="group flex gap-4">
                    <span className="sr-icon h-12 w-12 flex-none"><Icon name={g.icon} className="h-5 w-5" /></span>
                    <span>
                      <span className="block font-black">{g.title}</span>
                      <span className="block text-sm leading-snug text-muted-foreground">{g.lead}</span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-semibold text-primary">{g.items.map((m) => <span key={m.key}>{m.name}</span>)}</span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
          <div className="mb-10 text-center"><p className="sr-eyebrow">Who it is for</p></div>
          <div className="grid gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((x, i) => (
              <Reveal key={x.slug} delay={(i % 3) * 70}>
                <div className="relative space-y-3 border-t-2 border-primary/40 pt-6">
                  <span className="sr-outline absolute right-0 top-3 hidden text-5xl font-black leading-none xl:block" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-black">{x.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{x.summary}</p>
                  <ul className="space-y-2">{x.needs.map((n) => <li key={n} className="flex gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" strokeWidth={3} />{n}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Growth */}
      <section id="growth" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead center icon="rocket" eyebrow="How your company grows" title="From day one to a company" accent="that runs itself." lead="A suggested path, not a rule: launch in a day, get organised in a week, automate in a month — then see, grow and scale. Switch on a few panels at each step." />
          <ol className="relative mx-auto max-w-5xl space-y-12 lg:space-y-0">
            <span className="absolute bottom-0 left-[27px] top-0 w-px bg-gradient-to-b from-primary/60 via-primary/25 to-transparent lg:left-1/2" aria-hidden />
            {GROWTH.map((p, i) => (
              <Reveal key={p.id} as="li" delay={80} className={`relative pl-[72px] lg:w-1/2 lg:pb-14 lg:pl-0 ${i % 2 ? "lg:ml-auto lg:pl-14" : "lg:pr-14 lg:text-right"}`}>
                <span className={`sr-circle absolute left-0 top-0 h-[54px] w-[54px] text-base font-black shadow-xl shadow-primary/30 ring-[6px] ring-background ${i % 2 ? "lg:-left-[27px]" : "lg:left-auto lg:-right-[27px]"}`}>{i + 1}</span>
                <span className="inline-block rounded-full bg-gradient-to-r from-primary to-brand-accent px-3.5 py-1 text-xs font-black uppercase tracking-widest text-white">{p.when}</span>
                <h3 className="mt-3 text-2xl font-black leading-snug tracking-tight">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.goal}</p>
                <ul className={`mt-4 space-y-2 ${i % 2 ? "" : "lg:inline-block lg:text-left"}`}>{p.actions.slice(0, 3).map((a) => <li key={a} className="flex gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" strokeWidth={3} />{a}</li>)}</ul>
                <p className="mt-4 border-l-4 border-primary pl-4 text-left font-semibold leading-snug"><span className="text-primary">After · </span>{p.after}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Stories */}
      <section id="stories" className="sr-band sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container relative space-y-16">
          <SectionHead tone="dark" center icon="chart" eyebrow="Success stories" title="How teams run" accent="on the platform." lead="Customer stories appear here with the customer's permission and their real results. Until then, these are the whole-process scenarios the platform is built to automate." />
          {STORIES.length === 0 && <div className="sr-glass mx-auto max-w-2xl p-8 text-center"><p className="text-lg font-black">Customer stories are on the way</p><p className="mt-1 text-sm text-white/75">We publish a story only when a customer has agreed to share it, with their real results. None have been published yet.</p></div>}
          <div className="grid gap-5 lg:grid-cols-2">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.slug} delay={(i % 2) * 80}>
                <article className="sr-glass h-full space-y-5 p-8">
                  <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Scenario {i + 1}</p><h3 className="text-2xl font-black">{u.title}</h3><p className="mt-1 text-sm text-muted-foreground">{u.summary}</p></div>
                  <div><p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">The problem</p><p className="text-sm leading-relaxed">{u.problem}</p></div>
                  <div><p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">How it runs</p><ol className="space-y-2">{u.solution.map((s, n) => <li key={s} className="flex gap-3 text-sm"><span className="sr-circle mt-0.5 h-5 w-5 flex-none text-[10px] font-black">{n + 1}</span>{s}</li>)}</ol></div>
                  <p className="border-t pt-4 text-sm"><span className="font-bold text-primary">Result · </span>{u.result}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values and commitments */}
      <section id="values" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container space-y-20">
          <div>
            <SectionHead center icon="shield" eyebrow="Our values" title="What we hold" accent="ourselves to." />
            <IconColumns cols={3} items={VALUES.map((v) => ({ title: v.title, text: v.body, icon: v.icon }))} />
          </div>
          <div>
            <SectionHead center icon="lock" eyebrow="Our commitments" title="Control and protection" accent="built in." />
            <IconColumns cols={3} items={SECURITY_POINTS.map((x) => ({ title: x.title, text: x.body, icon: x.icon }))} />
            <p className="mt-10 text-center text-sm text-muted-foreground">Read the <Link href="/data-policy" className="font-bold text-primary">data policy</Link> and <Link href="/privacy" className="font-bold text-primary">privacy policy</Link>. Questions? <Link href="/contact" className="font-bold text-primary">Talk to us <ArrowRight className="inline h-3.5 w-3.5" /></Link></p>
          </div>
        </div>
      </section>


      <CtaBand title="Talk to the team — or just start." lead="We'd love to hear how your business runs today and where it loses time." />
      <FaqSection topics={["General", "Data & security", "Your brand"]} limit={6} />
    </>
  );
}
