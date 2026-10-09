import FaqSection from "@/components/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getFeatureGroups } from "@/lib/saas/modules";
import { featuresOf } from "@/lib/saas/feature-lists";
import { PageHero, SectionHead } from "@/components/saas/blocks";
import DocsSearch, { type DocEntry } from "@/components/saas/DocsSearch";
import Icon from "@/components/saas/Icon";
import Reveal from "@/components/saas/Reveal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Documentation",
  description: "Simple step-by-step guides for every feature of every SelfRun AI panel, with the real screen.",
  alternates: { canonical: "/docs" },
};

export default async function DocsPage() {
  const groups = await getFeatureGroups();
  const panels = groups.flatMap((g) => g.items);
  const total = panels.reduce((n, m) => n + featuresOf(m.key).length, 0);
  const entries: DocEntry[] = panels.flatMap((m) => featuresOf(m.key).map((f) => ({ panelKey: m.key, panel: m.name, slug: f.slug, name: f.name, text: f.text })));
  return (
    <>
      <PageHero art="docs" eyebrow={`${panels.length} panels · ${total} guides`} title="Documentation" accent="step by step." lead="Pick a panel, pick a feature. Every guide shows the real screen and the exact steps to follow." photo="laptop-talk" shot="support" shotName="Help & Support" />

      <nav aria-label="Panels" className="sticky top-[76px] z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="sr-container flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <DocsSearch entries={entries} />
          <div className="sr-scroll-x flex flex-1 gap-1.5">
            {panels.map((m) => <a key={m.key} href={`#${m.key}`} className="sr-tab shrink-0">{m.name}</a>)}
          </div>
        </div>
      </nav>

      <section className="sr-section pb-0">
        <div className="sr-container">
          <SectionHead icon="book" eyebrow="Choose a panel" title="Find your" accent="panel." lead={`${panels.length} panels, ${total} step-by-step guides. Pick the panel you work in.`} />
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {panels.map((m, i) => (
              <Reveal key={m.key} as="li" delay={(i % 5) * 50}>
                <a href={`#${m.key}`} className="group flex flex-col items-center text-center">
                  <span className="relative mb-4 inline-flex">
                    <span className="absolute inset-0 -z-10 scale-125 rounded-full bg-primary/25 blur-xl transition-opacity group-hover:opacity-100 sm:opacity-50" aria-hidden />
                    <span className="sr-icon h-16 w-16 rounded-3xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"><Icon name={m.icon} className="h-7 w-7" /></span>
                  </span>
                  <span className="font-black leading-tight group-hover:text-primary">{m.name}</span>
                  <span className="mt-0.5 text-xs font-semibold text-muted-foreground">{featuresOf(m.key).length} guides</span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="sr-section">
        <div className="sr-container space-y-20">
          {panels.map((m) => {
            const list = featuresOf(m.key);
            if (!list.length) return null;
            return (
              <div key={m.key} id={m.key} style={{ scrollMarginTop: 140 }}>
                <SectionHead icon={m.icon} eyebrow={`${list.length} guides`} title={m.name} lead={m.summary} />
                <ul className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((f, i) => (
                    <Reveal key={f.slug} as="li" delay={(i % 3) * 50}>
                      <Link href={`/docs/${m.key}/${f.slug}`} className="group flex items-start gap-4 border-b border-border/60 py-5 transition-all hover:bg-gradient-to-r hover:from-primary/[0.06] hover:to-transparent hover:pl-2">
                        <span className="sr-outline mt-0.5 w-9 flex-none text-2xl font-black leading-none" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-black leading-snug group-hover:text-primary">{f.name}</span>
                          <span className="mt-1 block text-sm leading-snug text-muted-foreground">{f.text}</span>
                        </span>
                        <ArrowUpRight className="mt-1 h-4 w-4 flex-none -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </Reveal>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
      <FaqSection topics={["Setup", "Support", "General"]} limit={5} />
    </>
  );
}
