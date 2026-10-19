import FaqSection from "@/components/platform/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { getFeatureGroups } from "@/lib/platform/saas/modules";
import { featuresOf } from "@/lib/platform/saas/feature-lists";
import { DOCS, DOC_CATEGORIES } from "@/lib/platform/saas/docs";
import { TUTORIALS } from "@/lib/platform/saas/tutorials";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import DocsSearch, { type DocEntry } from "@/components/platform/saas/DocsSearch";
import ProductDocsExplorer from "@/components/platform/saas/ProductDocsExplorer";
import SectionScrollNav from "@/components/platform/saas/SectionScrollNav";
import Icon from "@/components/platform/saas/Icon";
import Reveal from "@/components/platform/saas/Reveal";
import { SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Documentation",
  description: "Simple step-by-step guides and walkthroughs for every feature of every SelfRun AI product, with the real screen.",
  alternates: { canonical: "/docs" },
};

const NAV = [
  { id: "start", label: "Start here" },
  { id: "walkthroughs", label: "Walkthroughs" },
  { id: "guides", label: "General guides" },
  { id: "products", label: "Product guides" },
  { id: "help", label: "Need help" },
  { id: "faq", label: "FAQs" },
];

export default async function DocsPage() {
  const groups = await getFeatureGroups();
  const panels = groups.flatMap((g) => g.items);
  const total = panels.reduce((n, m) => n + featuresOf(m.key).length, 0);
  const entries: DocEntry[] = panels.flatMap((m) => featuresOf(m.key).map((f) => ({ panelKey: m.key, panel: m.name, slug: f.slug, name: f.name, text: f.text })));
  const explorer = panels.flatMap((m) => {
    const fs = featuresOf(m.key);
    if (!fs.length) return [];
    return [{ key: m.key, name: m.name, summary: m.summary, groups: [...new Set(fs.map((f) => f.group))].map((g) => ({ name: g, items: fs.filter((f) => f.group === g).map((f) => ({ slug: f.slug, name: f.name, text: f.text })) })) }];
  });
  const cats = DOC_CATEGORIES.map((c) => ({ ...c, list: DOCS.filter((d) => d.category === c.name) })).filter((c) => c.list.length);

  return (
    <>
      <PageHero art="docs" eyebrow={`${SAAS_PRODUCT_COUNT} products · ${total} guides · ${TUTORIALS.length} walkthroughs`} title="Documentation" accent="step by step." lead="Pick a product, pick a feature. Every guide shows the real screen and the exact steps to follow. New here? Start with the setup guide, or follow a walkthrough from start to finish." photo="laptop-talk" shot="support" shotName="SelfRun ResolveIQ">
        <HeroCtas primary={{ label: "Get started free", href: "/signup" }} secondary={{ label: "Browse walkthroughs", href: "#walkthroughs" }} />
      </PageHero>

      <SectionScrollNav items={NAV} label="Documentation sections" numbered />

      {/* 01 start */}
      <section id="start" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="01" icon="search" eyebrow="Start here" title="What do you want" accent="to do?" lead={`Search ${total} guides, or choose the way you like to learn.`} />
          <Reveal className="mb-12"><DocsSearch entries={entries} large /></Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: "rocket" as const, t: "Set up your workspace", x: "From a new account to a working company workspace, step by step.", href: "/docs/getting-started", c: "Open the setup guide" },
              { icon: "book" as const, t: "Follow a walkthrough", x: "Learn one whole job from start to finish, with the real screen beside each step.", href: "#walkthroughs", c: "See walkthroughs" },
              { icon: "layers" as const, t: "Look up a feature", x: "Pick your product and find the guide for the exact feature you use.", href: "#products", c: "Browse product guides" },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 70}><Link href={c.href} className="group flex h-full flex-col rounded-3xl border border-border/60 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"><span className="sr-icon mb-5 h-14 w-14 transition-transform group-hover:scale-110"><Icon name={c.icon} className="h-6 w-6" /></span><h3 className="text-xl font-black">{c.t}</h3><p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{c.x}</p><span className="mt-5 inline-flex items-center gap-2 font-bold text-primary">{c.c}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 02 walkthroughs */}
      <section id="walkthroughs" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="02" icon="rocket" eyebrow="Walkthroughs" title="Learn a job" accent="start to finish." lead="Each walkthrough takes you through one real job, one step at a time, with the real screen beside every step." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.map((t, i) => (
              <Reveal key={t.slug} delay={(i % 3) * 60}>
                <Link href={`/docs/walkthroughs/${t.slug}`} className="group flex h-full flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider"><span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">Walkthrough</span><span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{t.minutes} min · {t.level}</span></div>
                  <h3 className="text-lg font-black leading-snug group-hover:text-primary">{t.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">{t.summary}</p>
                  <p className="mt-3 text-xs font-bold text-muted-foreground">{t.steps.length} steps</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">Start the walkthrough<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 03 general guides */}
      <section id="guides" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="03" icon="book" eyebrow="General guides" title="The essentials," accent="in plain words." lead="Guides that apply across the platform: setup, people, your brand, automation and AI." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cats.map((c, i) => (
              <Reveal key={c.name} delay={(i % 3) * 60}>
                <div className="flex h-full flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3"><span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-accent text-sm font-black text-white shadow-md shadow-primary/25">{String(i + 1).padStart(2, "0")}</span><div><h3 className="font-black leading-tight">{c.name}</h3><p className="text-xs leading-snug text-muted-foreground">{c.blurb}</p></div></div>
                  <ul className="space-y-1">
                    {c.list.map((d) => (
                      <li key={d.slug}><Link href={`/docs/${d.slug}`} className="group flex items-start gap-2 rounded-xl px-2 py-2 text-[15px] font-semibold leading-snug transition-colors hover:bg-primary/[0.06] hover:text-primary"><BookOpen className="mt-0.5 h-4 w-4 flex-none text-primary" /><span className="flex-1">{d.title}</span><span className="flex-none text-xs font-bold text-muted-foreground">{d.readMinutes} min</span></Link></li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 04 product guides */}
      <section id="products" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="04" icon="layers" eyebrow="Product guides" title="Every feature of" accent="every product." lead={`${SAAS_PRODUCT_COUNT} products, ${total} step-by-step guides. Pick a product, then open the guide you need.`} />
          <ProductDocsExplorer panels={explorer} />
        </div>
      </section>

      {/* 05 help */}
      <section id="help" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="05" icon="chat" eyebrow="Need help" title="Stuck on" accent="something?" lead="If a guide does not answer it, there are other ways to get unstuck." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "chat" as const, t: "Ask the team", x: "We reply within one business day.", href: "/contact" },
              { icon: "target" as const, t: "Request a demo", x: "See it with your own scenarios.", href: "/demo" },
              { icon: "search" as const, t: "Read the FAQs", x: "Answers for every product.", href: "/faqs" },
              { icon: "chart" as const, t: "Check the status", x: "Is the platform up right now?", href: "/status" },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 60}><Link href={c.href} className="group flex h-full flex-col rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"><span className="sr-icon mb-4 h-12 w-12"><Icon name={c.icon} className="h-5 w-5" /></span><h3 className="text-lg font-black">{c.t}</h3><p className="mt-1 flex-1 text-[15px] leading-relaxed text-muted-foreground">{c.x}</p><span className="mt-4 inline-flex items-center gap-2 font-bold text-primary">Open<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
      <FaqSection n="06" topics={["Setup", "Support", "General"]} limit={5} />
    </>
  );
}
