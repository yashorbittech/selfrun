import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Layers, Lightbulb, ListChecks, Monitor, Plug, Route, Sparkles, Users, type LucideIcon } from "lucide-react";
import { getFeatureModules } from "@/lib/saas/modules";
import { PANEL_VALUE, featuresOf } from "@/lib/saas/feature-lists";
import { PANEL_DETAIL } from "@/lib/saas/panel-detail";
import { guideFor } from "@/lib/saas/guide-steps";
import FaqSection from "@/components/saas/FaqSection";
import { HeroCtas, PageHero } from "@/components/saas/blocks";
import Icon from "@/components/saas/Icon";
import DocsNav from "@/components/saas/DocsNav";

export const dynamic = "force-dynamic";

function GuideHeading({ icon: I, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-xl font-black">
      <span className="sr-icon h-9 w-9 flex-none rounded-xl"><I className="h-4.5 w-4.5" /></span>
      {children}
    </h2>
  );
}

async function load(key: string, slug: string) {
  const all = await getFeatureModules();
  const m = all.find((x) => x.key === key);
  const list = featuresOf(key);
  const f = list.find((x) => x.slug === slug);
  return m && f ? { m, all, f, list } : null;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string; feature: string }> }): Promise<Metadata> {
  const { slug: key, feature } = await params;
  const d = await load(key, feature);
  return d ? { title: `${d.f.name} — ${d.m.name} guide`, description: `Step-by-step guide to ${d.f.name} in ${d.m.name}: ${d.f.text}`, alternates: { canonical: `/docs/${key}/${feature}` } } : {};
}

export default async function FeatureGuidePage({ params }: { params: Promise<{ slug: string; feature: string }> }) {
  const { slug: key, feature } = await params;
  const d = await load(key, feature);
  if (!d) notFound();
  const { m, all, f, list } = d;
  const guide = guideFor(m.key, f.name, m.name, f.text);
  const i = list.findIndex((x) => x.slug === f.slug);
  const prev = list[(i + list.length - 1) % list.length];
  const next = list[(i + 1) % list.length];
  const detail = PANEL_DETAIL[m.key];
  const value = PANEL_VALUE[m.key];
  const siblings = list.filter((x) => x.group === f.group && x.slug !== f.slug);
  const ft = guide.facts;
  const clean = (a: string[]) => a.filter((x) => !/[▼▲]|__/.test(x));
  const groupNames = [...new Set(list.map((x) => x.group))];
  const fit = detail?.workflow[Math.min(groupNames.indexOf(f.group), (detail?.workflow.length ?? 1) - 1)];
  const onScreen = ft ? [
    { t: "Tabs", v: ft.tabs }, { t: ft.labels.some((l) => /\*$/.test(l)) ? "Form fields" : "Search and filters", v: [...ft.placeholders.slice(0, 1), ...clean(ft.labels)] }, { t: "Columns in the list", v: ft.headers }, { t: "Buttons", v: clean(ft.buttons).filter((b) => !/^(previous|next|columns)$/i.test(b)) }, { t: "Sections", v: ft.headings },
  ].filter((x) => x.v.length) : [];
  const navPanels = all.map((p) => {
    const fs = featuresOf(p.key);
    return { key: p.key, name: p.name, icon: p.icon, groups: [...new Set(fs.map((x) => x.group))].map((g) => ({ name: g, items: fs.filter((x) => x.group === g).map((x) => ({ slug: x.slug, name: x.name })) })) };
  }).filter((p) => p.groups.length);
  const toc = [
    { id: "simple", label: "In simple words", show: true },
    { id: "before", label: "Before you start", show: true },
    { id: "steps", label: guide.auto ? "How it works" : "Step by step", show: true },
    { id: "tips", label: "Tips", show: guide.tips.length > 0 },
    { id: "recap", label: "Quick recap", show: true },
    { id: "connects", label: "What it connects to", show: !!detail && detail.connects.length > 0 },
    { id: "screen", label: "What you will see", show: onScreen.length > 0 },
    { id: "why", label: `Why use ${m.name}`, show: !!value },
    { id: "who", label: `Who uses ${m.name}`, show: !!detail && detail.audience.length > 0 },
    { id: "more", label: `More in ${f.group}`, show: siblings.length > 0 },
  ].filter((x) => x.show);
  return (
    <>
    <PageHero art={`panel-${m.key}`} eyebrow={`${m.name} · ${f.group}`} title={f.name} lead={f.text} photo="laptop-talk" shot={m.key} shotName={m.name} chip={{ title: guide.auto ? "Works on its own" : `${guide.steps.length} simple steps`, text: "With the real screen" }}>
      <HeroCtas primary={{ label: guide.auto ? "See how it works" : "Start the steps", href: "#steps" }} secondary={{ label: `All ${m.name} guides`, href: `/docs#${m.key}` }} />
    </PageHero>
    <section className="sr-section">
      <div className="sr-container grid max-w-[calc(var(--sr-max)+12rem)] gap-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[340px_minmax(0,1fr)_280px] 2xl:grid-cols-[380px_minmax(0,1fr)_300px]">
      <aside className="hidden xl:block">
        <div className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col rounded-3xl border border-border/60 bg-background p-4 shadow-sm">
          <DocsNav panels={navPanels} currentPanel={m.key} currentSlug={f.slug} />
        </div>
      </aside>
      <div className="min-w-0 space-y-12">
        <details className="group rounded-2xl border border-border/60 bg-background shadow-sm xl:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Browse all documentation</span><ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" /></summary>
          <div className="max-h-[70vh] border-t border-border/60 p-3 [&>nav]:max-h-[65vh]"><DocsNav panels={navPanels} currentPanel={m.key} currentSlug={f.slug} /></div>
        </details>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary">Documentation</Link><ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/docs#${m.key}`} className="hover:text-primary">{m.name}</Link><ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">{f.name}</span>
        </nav>

        {guide.img && (
          <figure>
            <div className="sr-stage p-3 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-3.5 py-2.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /><span className="ml-3 truncate rounded-full bg-background px-3 py-0.5 text-[11px] text-muted-foreground">{m.name} · {ft?.title ?? f.name}</span></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={guide.img} alt={`${m.name} — ${f.name}: the real screen`} width={1280} height={800} loading="eager" decoding="async" className="block h-auto w-full" />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">The real screen used in this guide.</figcaption>
          </figure>
        )}

        <section id="simple" className="scroll-mt-32">
          <GuideHeading icon={BookOpen}>In simple words</GuideHeading>
          <p className="leading-relaxed text-muted-foreground"><b className="text-foreground">{f.name}</b> is part of {m.name}. {f.text}{/[.!?]$/.test(f.text) ? "" : "."} {guide.auto ? "You do not have to do anything for it to work — this guide shows you where to see it." : `This guide takes you through it in ${guide.steps.length} short steps.`}</p>
          {fit && <p className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4 text-sm leading-relaxed"><b>Where it fits in your work — {fit.title}.</b> <span className="text-muted-foreground">{fit.text}</span></p>}
        </section>

        <section id="before" className="scroll-mt-32">
          <GuideHeading icon={ListChecks}>Before you start</GuideHeading>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-3"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span>You need to be signed in to your company&apos;s workspace. {m.name} appears in the Workspace dashboard and in the left menu when your role includes it.</span></li>
            <li className="flex gap-3"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span>What you can see and change depends on your role. If a menu item or button is missing, ask your workspace owner to give your role access in Workspace → Users.</span></li>
            <li className="flex gap-3"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span>{f.name} belongs to <b className="text-foreground">{f.group}</b> in {m.name}. {f.text}{/[.!?]$/.test(f.text) ? "" : "."}</span></li>
          </ul>
        </section>

        <section id="steps" className="scroll-mt-32">
        <GuideHeading icon={Route}>{guide.auto ? "How it works" : "Step by step"}</GuideHeading>
        <ol className="sr-steps space-y-7">
          {guide.steps.map((st, n) => (
            <li key={n} className="relative pl-16">
              <span className="sr-circle absolute left-0 top-0 h-11 w-11 text-base font-black shadow-lg shadow-primary/30 ring-4 ring-background">{n + 1}</span>
              <div className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Step {n + 1}</p>
                <p className="mt-1 text-lg font-black leading-snug">{st.title}</p>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{st.text}</p>
                {st.items && <ul className="mt-3 flex flex-wrap gap-1.5">{st.items.map((it) => <li key={it} className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold">{it}</li>)}</ul>}
              </div>
            </li>
          ))}
        </ol>
        </section>


        {guide.tips.length > 0 && (
          <section id="tips" className="scroll-mt-32">
            <GuideHeading icon={Lightbulb}>Tips</GuideHeading>
            <ul className="space-y-2">{guide.tips.map((tp) => <li key={tp} className="flex gap-3 text-muted-foreground"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span>{tp}</span></li>)}</ul>
          </section>
        )}

        <section id="recap" className="scroll-mt-32">
          <GuideHeading icon={Route}>Quick recap</GuideHeading>
          <p className="text-muted-foreground">{guide.steps.map((st) => st.title).join("  →  ")}</p>
        </section>

        {detail && detail.connects.length > 0 && (
          <section id="connects" className="scroll-mt-32">
            <GuideHeading icon={Plug}>What it connects to</GuideHeading>
            <ul className="grid gap-3 sm:grid-cols-2">{detail.connects.map((c) => { const o = all.find((x) => x.key === c.panel); return o ? <li key={c.panel} className="rounded-2xl border border-border/60 p-4"><p className="font-black">{o.name}</p><p className="text-sm leading-snug text-muted-foreground">{c.text}</p></li> : null; })}</ul>
          </section>
        )}

        {onScreen.length > 0 && (
          <section id="screen" className="scroll-mt-32">
            <GuideHeading icon={Monitor}>What you will see on this screen</GuideHeading>
            <p className="mb-4 text-sm text-muted-foreground">These are the parts of the {ft?.title} screen, exactly as they appear in the product.</p>
            <div className="space-y-4">
              {onScreen.map((g) => (
                <div key={g.t} className="rounded-2xl border border-border/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">{g.t}</p>
                  <ul className="flex flex-wrap gap-1.5">{g.v.map((x) => <li key={x} className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs font-semibold">{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {value && (
          <section id="why" className="scroll-mt-32">
            <GuideHeading icon={Sparkles}>Why use {m.name}</GuideHeading>
            <p className="mb-3 text-muted-foreground">{m.name} replaces {value.replaces.toLowerCase()}, on the same login and the same data.</p>
            <ul className="space-y-2">{value.benefits.map((b) => <li key={b} className="flex gap-3"><span className="sr-circle mt-1 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span><span>{b}</span></li>)}</ul>
          </section>
        )}

        {detail && detail.audience.length > 0 && (
          <section id="who" className="scroll-mt-32">
            <GuideHeading icon={Users}>Who uses {m.name}</GuideHeading>
            <ul className="grid gap-3 sm:grid-cols-2">{detail.audience.map((a) => <li key={a.who} className="rounded-2xl border border-border/60 p-4"><p className="font-black">{a.who}</p><p className="text-sm leading-snug text-muted-foreground">{a.does}</p></li>)}</ul>
          </section>
        )}

        {siblings.length > 0 && (
          <section id="more" className="scroll-mt-32">
            <GuideHeading icon={Layers}>More in {f.group}</GuideHeading>
            <div className="grid gap-3 sm:grid-cols-2">{siblings.map((s) => <Link key={s.slug} href={`/docs/${m.key}/${s.slug}`} className="rounded-2xl border border-border/60 p-4 transition-all hover:border-primary/40"><p className="font-black">{s.name}</p><p className="text-sm leading-snug text-muted-foreground">{s.text}</p></Link>)}</div>
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {[{ p: prev, d: "Previous guide" }, { p: next, d: "Next guide" }].map(({ p, d: dir }, k) => (
            <Link key={dir} href={`/docs/${m.key}/${p.slug}`} className={`rounded-2xl border border-border/60 p-4 transition-all hover:border-primary/40 ${k ? "sm:text-right" : ""}`}>
              <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">{dir}</span><span className="mt-1 block font-black leading-snug">{p.name}</span>
            </Link>
          ))}
        </div>
        <Link href={`/docs#${m.key}`} className="sr-link"><ArrowLeft className="h-4 w-4" /> All {m.name} guides <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-5">
          <div className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3"><span className="sr-icon h-10 w-10"><Icon name={m.icon} className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Guide</p><p className="font-black leading-tight">{m.name}</p></div></div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">On this page</p>
            <ul className="space-y-0.5 border-l border-border/60">
              {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">{t.label}</a></li>)}
            </ul>
          </div>
          <div className="sr-band rounded-3xl p-5 shadow-xl shadow-primary/20">
            <p className="font-black leading-snug">Use {f.name} in your own workspace.</p>
            <p className="mt-1 text-sm text-white/75">Free forever for one person — every panel included.</p>
            <Link href="/signup" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-105">Get started free <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </aside>
      </div>
    </section>
    <FaqSection
      topics={["Setup", "Support", "General"]}
      limit={3}
      title="Common"
      accent="questions."
      lead={`About ${f.name} and ${m.name}.`}
      extra={[
        { q: `I cannot see ${f.name} in the menu.`, a: `Your role may not include it. Ask your workspace owner to open Workspace → Users and give your role access to ${m.name}.` },
        { q: "Can I do this on my phone?", a: "Yes. SelfRun AI works in the browser on any device and can be installed as an app on Android, iOS and desktop, with the same screens and the same data." },
        { q: "Does this cost extra?", a: `No. ${f.name} comes with the ${m.name} panel, and every panel is included in every plan.` },
      ]}
    />
    </>
  );
}
