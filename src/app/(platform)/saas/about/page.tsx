import FaqSection from "@/components/platform/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { INDUSTRIES, SECURITY_POINTS, USE_CASES } from "@/lib/platform/saas/content";
import { GROWTH } from "@/lib/platform/saas/site";
import { DOCS } from "@/lib/platform/saas/docs";
import { TUTORIALS } from "@/lib/platform/saas/tutorials";
import { featureCount } from "@/lib/platform/saas/feature-lists";
import { getFeatureGroups } from "@/lib/platform/saas/modules";
import { CtaBand, HeroCtas, PageHero } from "@/components/platform/saas/blocks";
import { panelColor } from "@/lib/platform/saas/palette";
import Icon from "@/components/platform/saas/Icon";
import { NumberedRows } from "@/components/platform/saas/Modern";
import CountStats from "@/components/platform/saas/CountStats";
import SectionScrollNav from "@/components/platform/saas/SectionScrollNav";
import Reveal from "@/components/platform/saas/Reveal";
import MarketingShot from "@/components/platform/saas/MarketingShot";
import AboutHeroArtwork from "@/components/platform/saas/AboutHeroArtwork";
import CustomerStoriesSection from "@/components/platform/saas/CustomerStoriesSection";
import { SAAS_BRAND } from "@/lib/platform/saas/brand";
import { SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";

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
  { title: "Simple on the surface", body: "Powerful software should still be easy to start with. Guided setup, sensible defaults and one consistent design across every product.", icon: "bolt" as const },
  { title: "Your brand, not ours", body: "Every company runs the platform under its own name — logo, colours, domain, emails and apps. SelfRun stays in the background.", icon: "target" as const },
  { title: "Honest by default", body: "We describe the product as it is. Where there is no customer story to share yet, we say so rather than invent one.", icon: "check" as const },
];

const PRINCIPLES = [
  { title: "Take the repetitive work off people", body: "Copying data between tools, chasing approvals and compiling reports should be the platform's job, so people spend their time on customers, craft and growth." },
  { title: "Independent products", body: "Each product keeps its own sign-in and data. Choose the products that fit your business and run each one on its own." },
  { title: "Automation people can trust", body: "Every run is logged and explained, workflows can be paused at any time, and approvals keep people in control of anything that moves money." },
  { title: "Intelligence with permission", body: "AI answers from your real records, shows how it got there, and only sees what the person asking is allowed to see." },
];

const NAV = [
  { id: "about", label: "About us" },
  { id: "mission", label: "Our mission" },
  { id: "what-we-do", label: "What we do" },
  { id: "numbers", label: "What we have built" },
  { id: "who", label: "Who it is for" },
  { id: "growth", label: "How you grow" },
  { id: "stories", label: "Stories and workflows" },
  { id: "values", label: "Our values" },
  { id: "commitments", label: "Our commitments" },
  { id: "connect", label: "Get in touch" },
];

function Head({ id, title, accent, lead, dark = false }: { id: string; title: string; accent?: string; lead?: string; dark?: boolean }) {
  const n = String(NAV.findIndex((x) => x.id === id) + 1).padStart(2, "0");
  return (
    <Reveal className="mx-auto mb-12 max-w-3xl text-center">
      <p className={`mb-4 flex flex-col items-center gap-3 text-xs font-black uppercase tracking-[0.2em] ${dark ? "text-white/80" : "text-primary"}`}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-accent text-lg tracking-normal text-white shadow-lg shadow-primary/30">{n}</span>{NAV.find((x) => x.id === id)?.label}</p>
      <h2 className="text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">{title}{accent && <> <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">{accent}</span></>}</h2>
      {lead && <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/75" : "text-muted-foreground"}`}>{lead}</p>}
    </Reveal>
  );
}

export default async function AboutPage() {
  const groups = await getFeatureGroups();
  const modules = groups.flatMap((g) => g.items);
  const orbitPanels = modules.map((module) => ({ ...module, color: panelColor(module.key) }));
  return (
    <>
      <PageHero artContent={<AboutHeroArtwork panels={orbitPanels} brand={SAAS_BRAND.name} />}
        eyebrow="About SelfRun AI"
        title="We believe a business"
        accent="should run itself."
        lead="Too many companies spend their best hours copying data between tools, chasing approvals and compiling reports. SelfRun AI exists to take that work off people's plates — with one AI-powered platform that runs the routine."
      >
        <HeroCtas primary={{ label: "Get started free", href: "/signup" }} secondary={{ label: "Contact us", href: "/contact" }} />
      </PageHero>

      <SectionScrollNav items={NAV} label="On this page" numbered />

      {/* About us */}
      <section id="about" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="about" title="One platform for" accent="the whole company." />
          <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="sr-prose">
              <p>{SAAS_BRAND.name} brings independent business products together in one suite — CRM, HR and payroll, finance, projects, procurement, training, documents, a website builder, team chat and more. Each product has its own sign-in and database, and can run on its own.</p>
              <p>Use the products separately or manage them from one place. AI works with the records available in its product, while configurable workflows can automate handoffs between products when you choose to connect them.</p>
              <p>The platform is multi-tenant by design. Every company is a customer of the same product, with the same features, the same onboarding and the same safeguards. There is no special version for anyone — and every company runs it under its own brand, on the web, as an installable app, on Android and iOS and on the desktop.</p>
            </div>
            <div className="mt-8 border-t border-border/60"><CountStats items={[{ v: String(SAAS_PRODUCT_COUNT), l: "independent products" }, { v: "Own", l: "sign-in per product" }, { v: "Own", l: "database per product" }]} /></div>
          </div>
          <Reveal><MarketingShot screenKey="workspace" name="SelfRun CommandOS" /></Reveal>
        </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="sr-section relative overflow-hidden bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="mission" title="Give every business a platform" accent="that runs the routine." lead="From a ten-person firm to a growing enterprise: one intelligent system that handles the repetitive parts of running a company, so people can focus on what only people can do — customers, craft and growth." />
          <NumberedRows items={PRINCIPLES.map((p) => ({ title: p.title, text: p.body }))} />
        </div>
      </section>

      {/* What we do */}
      <section id="what-we-do" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="what-we-do" title="Seven areas of your business," accent="one platform." lead="We build and run the platform your company works in. Each area below is a set of products — all included in every plan." />
          <div className="mb-20">
            <ul className="grid gap-x-10 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((g, i) => (
                <Reveal key={g.id} as="li" delay={i * 50}>
                  <Link href={`/products#${g.id}`} className="group flex gap-4">
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
        </div>
      </section>

      {/* What we have built */}
      <section id="numbers" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="numbers" title="What we have built," accent="in numbers." lead="Counted from the live product, not rounded up for effect." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: String(modules.length), l: "independent products", x: "Each with its own sign-in and its own data." },
              { v: `${modules.reduce((n, m) => n + (featureCount(m.key) || m.capabilities.length), 0)}+`, l: "features", x: "All included in every plan, starting free." },
              { v: String(groups.length), l: "areas of your business", x: "From sales and people to finance and your website." },
              { v: String(DOCS.length + TUTORIALS.length), l: "guides and walkthroughs", x: "Step by step, with the real screen." },
            ].map((n, i) => (
              <Reveal key={n.l} delay={i * 60}>
                <div className="h-full rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.07] via-card to-brand-accent/[0.07] p-7 text-center shadow-sm">
                  <p className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-6xl font-black leading-none tracking-tighter text-transparent">{n.v}</p>
                  <p className="mt-3 text-lg font-black">{n.l}</p>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">{n.x}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section id="who" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="who" title="Built for the way" accent="you work." lead="The same platform serves very different companies. Here are the kinds of business it fits, and what each of them gets from it." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((x, i) => (
              <Reveal key={x.slug} delay={(i % 3) * 70}>
                <div className="group h-full rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-accent text-sm font-black text-white shadow-md shadow-primary/25">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-black leading-snug">{x.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.summary}</p>
                  <ul className="mt-4 space-y-2">{x.needs.map((n) => <li key={n} className="flex gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" strokeWidth={3} />{n}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Growth */}
      <section id="growth" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="growth" title="From day one to a company" accent="that runs itself." lead="A suggested path, not a rule: launch in a day, get organised in a week, automate in a month — then see, grow and scale. Switch on a few products at each step." />
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
          <CustomerStoriesSection tone="dark" />
          <Head id="stories" title="Stories built around" accent="how work gets done." lead="Explore realistic workflow narratives based on capabilities in the product. They show how SelfRun connects teams and records without presenting invented customers or outcomes." dark />
          <div className="grid gap-5 lg:grid-cols-2">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.slug} delay={(i % 2) * 80}>
                <article className="sr-glass h-full space-y-5 p-8">
                  <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Illustrative product workflow</p><h3 className="text-2xl font-black">{u.title}</h3><p className="mt-1 text-sm text-muted-foreground">{u.summary}</p><p className="mt-4 text-sm leading-relaxed text-white/80">{u.narrative}</p></div>
                  <div><p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">The problem</p><p className="text-sm leading-relaxed">{u.problem}</p></div>
                  <div><p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">How it runs</p><ol className="space-y-2">{u.solution.map((s, n) => <li key={s} className="flex gap-3 text-sm"><span className="sr-circle mt-0.5 h-5 w-5 flex-none text-[10px] font-black">{n + 1}</span>{s}</li>)}</ol></div>
                </article>
              </Reveal>
            ))}
          </div>
          <div className="text-center"><Link href="/success-stories" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">Explore customer stories and workflows <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="values" title="What we hold" accent="ourselves to." lead="Six values that decide how we build and how we talk about the product." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 60}>
                <div className="group h-full rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <span className="sr-icon mb-4 h-12 w-12 transition-transform group-hover:scale-110"><Icon name={v.icon} className="h-5 w-5" /></span>
                  <h3 className="text-lg font-black leading-snug">{v.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section id="commitments" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="commitments" title="Control and protection" accent="built in." lead="What protects your company's data and keeps you in charge of it." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SECURITY_POINTS.map((x, i) => (
              <Reveal key={x.title} delay={(i % 3) * 60}>
                <div className="flex h-full gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-sm"><span className="sr-icon h-12 w-12 flex-none"><Icon name={x.icon} className="h-5 w-5" /></span><span><span className="block font-black leading-snug">{x.title}</span><span className="mt-1 block text-[15px] leading-relaxed text-muted-foreground">{x.body}</span></span></div>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">Read <Link href="/security" className="font-bold text-primary">security &amp; trust</Link>, the <Link href="/data-policy" className="font-bold text-primary">data policy</Link> and the <Link href="/sla" className="font-bold text-primary">service level</Link>.</p>
        </div>
      </section>

      {/* Get in touch */}
      <section id="connect" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <Head id="connect" title="Let's talk about" accent="your business." lead="Start free on your own, see the platform with your scenarios, or ask us anything first." />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: "rocket" as const, t: "Start free", x: "Register with your work email and switch on the products you need. No card needed.", href: "/signup", c: "Get started free" },
              { icon: "target" as const, t: "See it with your scenarios", x: "Bring one process you want to improve and we will show how the platform handles it.", href: "/demo", c: "Request a demo" },
              { icon: "chat" as const, t: "Ask us anything", x: "Questions about plans, fit or security? Send a message and we reply within one business day.", href: "/contact", c: "Contact us" },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 70}>
                <Link href={c.href} className="group flex h-full flex-col rounded-3xl border border-border/60 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <span className="sr-icon mb-5 h-14 w-14 transition-transform group-hover:scale-110"><Icon name={c.icon} className="h-6 w-6" /></span>
                  <h3 className="text-xl font-black">{c.t}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{c.x}</p>
                  <span className="mt-5 inline-flex items-center gap-2 font-bold text-primary">{c.c}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title="Talk to the team — or just start." lead="We'd love to hear how your business runs today and where it loses time." />
      <FaqSection topics={["General", "Data & security", "Your brand"]} limit={6} />
    </>
  );
}
