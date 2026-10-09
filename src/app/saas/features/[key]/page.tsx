import FaqSection from "@/components/saas/FaqSection";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Zap } from "lucide-react";
import { getFeatureModules } from "@/lib/saas/modules";
import { FEATURE_LISTS, PANEL_VALUE, featureCount } from "@/lib/saas/feature-lists";
import { PANEL_DETAIL } from "@/lib/saas/panel-detail";
import { EXTRA_SCREENS } from "@/lib/saas/site";
import { screenFor } from "@/lib/saas/screens";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/saas/blocks";
import { IconColumns, NumberedRows, TimelineSteps } from "@/components/saas/Modern";
import Icon from "@/components/saas/Icon";
import Reveal from "@/components/saas/Reveal";
import DeviceScene, { type SceneVariant } from "@/components/saas/DeviceScene";

export const dynamic = "force-dynamic";

async function load(key: string) {
  const all = await getFeatureModules();
  const i = all.findIndex((m) => m.key === key);
  return i < 0 ? null : { m: all[i], all, prev: all[(i + all.length - 1) % all.length], next: all[(i + 1) % all.length] };
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const d = await load((await params).key);
  if (!d) return {};
  return { title: `${d.m.name} — features`, description: `${d.m.headline}. ${d.m.summary}`, alternates: { canonical: `/features/${d.m.key}` } };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "benefits", label: "Benefits" },
  { id: "who", label: "Who uses it" },
  { id: "how", label: "How it works" },
  { id: "features", label: "Every feature" },
  { id: "automation", label: "Runs automatically" },
  { id: "connected", label: "Connected panels" },
  { id: "screens", label: "Screens" },
];

export default async function FeatureDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const d = await load((await params).key);
  if (!d) notFound();
  const { m, all, prev, next } = d;
  const groups = FEATURE_LISTS[m.key] ?? [];
  const total = featureCount(m.key) || m.capabilities.length;
  const value = PANEL_VALUE[m.key];
  const detail = PANEL_DETAIL[m.key];
  const byKey = new Map(all.map((x) => [x.key, x]));
  const extras = (EXTRA_SCREENS[m.key] ?? []).filter((x) => screenFor(x.key));
  const nav = SECTIONS.filter((s) => (s.id !== "connected" || detail?.connects.length) && (s.id !== "screens" || screenFor(m.key)) && (s.id !== "benefits" || value) && (s.id !== "who" && s.id !== "how" || detail));

  return (
    <>
      <PageHero art={`panel-${m.key}`} eyebrow={`${m.name} · ${total} features`} title={m.headline} lead={m.summary} photo="analytics" shot={m.key} shotName={m.name}>
        <HeroCtas />
      </PageHero>

      {/* facts */}
      <section className="border-b border-border/50 bg-muted/10">
        <div className="sr-container grid grid-cols-2 lg:grid-cols-4">
          {[
            { v: String(total), l: "features" },
            { v: String(m.automations.length), l: "automations out of the box" },
            { v: value ? "1 panel" : "Included", l: value ? `replaces ${value.replaces.split(" & ")[0].toLowerCase()} tools` : "in every plan" },
            { v: "Every plan", l: "free forever included" },
          ].map((s) => (
            <div key={s.l} className="px-4 py-7 text-center">
              <p className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-3xl font-black text-transparent sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <nav aria-label={`${m.name} sections`} className="sticky top-[76px] z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="sr-container sr-scroll-x flex gap-1.5 py-3">
          <Link href="/features" className="sr-tab inline-flex shrink-0 items-center gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />All panels</Link>
          {nav.map((s) => <a key={s.id} href={`#${s.id}`} className="sr-tab shrink-0">{s.label}</a>)}
        </div>
      </nav>

      {/* overview */}
      <section id="overview" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead center icon={m.icon} eyebrow="Overview" title={m.name} accent="in one page." lead={detail?.intro ?? m.summary} />
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="space-y-9">
              <blockquote className="relative rounded-[1.75rem] bg-gradient-to-br from-primary to-brand-accent p-7 text-white shadow-xl shadow-primary/25">
                <span className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-black text-primary shadow-lg">“</span>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">The result</p>
                <p className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{m.outcome}</p>
              </blockquote>

              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">Key capabilities</p>
                <ul className="space-y-3">
                  {m.capabilities.map((c) => <li key={c} className="flex gap-3.5 text-[17px] leading-snug"><span className="sr-circle mt-0.5 h-6 w-6"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>{c}</li>)}
                </ul>
              </div>

              {groups.length > 0 && (
                <div>
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">What it covers</p>
                  <div className="flex flex-wrap gap-2.5">
                    {groups.map((g) => <a key={g.title} href="#features" className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md">{g.title}<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">{g.items.length}</span></a>)}
                  </div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {value && (
                  <div className="border-l-4 border-primary/50 pl-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Replaces</p>
                    <p className="mt-1.5 font-semibold leading-snug">{value.replaces}</p>
                  </div>
                )}
                {detail && (
                  <div className="border-l-4 border-primary/50 pl-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Best for</p>
                    <p className="mt-1.5 font-semibold leading-snug">{detail.audience.map((a) => a.who).join(" · ")}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <a href="#features" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105">See every feature <ArrowRight className="h-4 w-4" /></a>
                <Link href={`/docs#${m.key}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-bold transition-all hover:border-primary hover:text-primary">Read the guides</Link>
              </div>
            </div>

            <div className="space-y-8 lg:sticky lg:top-32">
              <Reveal><DeviceScene screenKey={m.key} name={m.name} variant={3} /></Reveal>
              {detail && detail.workflow.length > 0 && (
                <Reveal delay={100}>
                  <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">From start to finish</p>
                  <ol className="flex items-start justify-between gap-2">
                    {detail.workflow.map((w, n) => (
                      <li key={w.title} className="relative flex flex-1 flex-col items-center text-center">
                        {n < detail.workflow.length - 1 && <span className="absolute left-1/2 top-[19px] -z-0 h-[2px] w-full bg-gradient-to-r from-primary/60 to-primary/20" aria-hidden />}
                        <span className="sr-circle relative z-10 h-10 w-10 text-sm font-black shadow-lg shadow-primary/30 ring-4 ring-background">{n + 1}</span>
                        <span className="mt-2 text-sm font-bold leading-tight">{w.title}</span>
                      </li>
                    ))}
                  </ol>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* benefits */}
      {value && (
        <section id="benefits" className="sr-band sr-section" style={{ scrollMarginTop: 140 }}>
          <div className="sr-container relative">
            <SectionHead tone="dark" center icon="rocket" eyebrow="Why teams use it" title={`What ${m.name} gives you`} accent="that separate tools don't." lead={`It replaces ${value.replaces.toLowerCase()} — as one panel inside the same platform, on the same login and the same data.`} />
            <div className="grid gap-5 sm:grid-cols-2">
              {value.benefits.map((b, i) => (
                <Reveal key={b} delay={(i % 2) * 80}>
                  <div className="sr-glass relative h-full overflow-hidden p-7">
                    <span className="pointer-events-none absolute -right-2 -top-5 select-none text-8xl font-black text-white/[0.07]" aria-hidden>0{i + 1}</span>
                    <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Check className="h-5 w-5" strokeWidth={3} /></span>
                    <p className="text-xl font-bold leading-snug">{b}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* who */}
      {detail && (
        <section id="who" className="sr-section" style={{ scrollMarginTop: 140 }}>
          <div className="sr-container">
            <SectionHead center icon="users" eyebrow="Who uses it" title="One panel," accent="the right view for everyone." lead="People see and do only what their role allows, so each person gets a screen that fits their job." />
            <IconColumns items={detail.audience.map((a) => ({ title: a.who, text: a.does, icon: "users" as const }))} />
          </div>
        </section>
      )}

      {/* how it works */}
      {detail && (
        <section id="how" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
          <div className="sr-container">
            <SectionHead center icon="workflow" eyebrow="How it works" title="From start to finish," accent="step by step." lead={detail.intro} />
            <TimelineSteps items={detail.workflow.map((w) => ({ title: w.title, text: w.text }))} />
          </div>
        </section>
      )}

      {/* every feature */}
      <section id="features" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead icon="layers" eyebrow={`${total} features`} title={`Every ${m.name} feature,`} accent="explained." lead="Grouped the way the panel's own menu groups them. All of it is included in every plan." />
          <div className="space-y-10">
            {groups.map((g) => (
              <Reveal key={g.title}>
                <div className="mb-5 flex items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <h3 className="flex items-center gap-3 text-xl font-black"><span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-primary to-brand-accent" />{g.title}</h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{g.items.length} features</span>
                </div>
                <div className="grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((it) => (
                    <div key={it.name} className="group flex gap-4 border-b border-border/60 py-5 transition-colors hover:bg-gradient-to-r hover:from-primary/[0.05] hover:to-transparent">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30"><CheckCircle2 className="h-5 w-5" aria-hidden /></span>
                      <div>
                        <p className="font-bold leading-snug">{it.name}</p>
                        {it.text && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* automation */}
      <section id="automation" className="sr-band sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container relative">
          <SectionHead tone="dark" center icon="bolt" eyebrow="Runs automatically" title={`${m.name} works`} accent="while you don't." lead="These happen on their own — notifications, reminders and hand-offs to other panels. Every run is logged, and you can pause any workflow." />
          <div className="grid gap-4 md:grid-cols-2">
            {m.automations.map((a, i) => (
              <Reveal key={a} delay={(i % 2) * 70}>
                <div className="sr-glass flex items-center gap-4 p-5">
                  <span className="relative flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-lg"><Zap className="h-5 w-5" /><span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-emerald-300" aria-hidden /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300" aria-hidden /></span>
                  <p className="font-semibold leading-snug">{a}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-white/75">Build your own in <Link href="/features/workspace#features" className="font-bold text-white underline underline-offset-4">Workspace → Automations</Link>.</p>
        </div>
      </section>

      {/* connected */}
      {detail && detail.connects.length > 0 && (
        <section id="connected" className="sr-section" style={{ scrollMarginTop: 140 }}>
          <div className="sr-container">
            <SectionHead center icon="plug" eyebrow="Connected panels" title="Nothing is re-typed." accent="Everything is connected." lead={`${m.name} shares one database with every other panel, so work moves between teams on its own.`} />
            <NumberedRows items={detail.connects.flatMap((c) => { const o = byKey.get(c.panel); return o ? [{ title: o.name, text: c.text, icon: o.icon, href: `/features/${o.key}` }] : []; })} />
          </div>
        </section>
      )}

      {/* ask AI */}
      {detail?.ask && (
        <section className="sr-section border-y border-border/50 bg-gradient-to-br from-primary/[0.05] to-brand-accent/[0.06]">
          <div className="sr-container">
            <SectionHead icon="bot" eyebrow="Ask AI" title={`Ask ${m.name}`} accent="anything." lead="Plain-language questions, answered from your real records — with the working shown." />
            <div className="sr-stage mx-auto max-w-4xl p-5 sm:p-8">
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-5 py-4 shadow-sm">
                <span className="sr-circle h-9 w-9"><Zap className="h-4 w-4" /></span>
                <span className="text-[15px] text-muted-foreground">Ask {m.name} anything…<span className="sr-caret" /></span>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {detail.ask.map((q) => <li key={q} className="rounded-2xl border border-border/60 bg-background px-5 py-3.5 text-[15px] font-semibold shadow-sm">“{q}”</li>)}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* screens */}
      {screenFor(m.key) && (
        <section id="screens" className="sr-section" style={{ scrollMarginTop: 140 }}>
          <div className="sr-container space-y-14">
            <SectionHead center icon="chart" eyebrow="Screens" title={`${m.name},`} accent="exactly as your team sees it." lead="Real, full-resolution screens of the live product, captured in a demo workspace with sample data." />
            <Reveal><div className="sr-stage p-5 sm:p-10"><DeviceScene screenKey={m.key} name={`${m.name} dashboard`} variant={2} /></div></Reveal>
            {extras.length > 0 && (
              <div className="grid gap-12 lg:grid-cols-2">
                {extras.map((x, i) => (
                  <Reveal key={x.key} delay={i * 80}>
                    <figure className="space-y-4">
                      <DeviceScene screenKey={x.key} name={x.title} variant={((i + 3) % 6) as SceneVariant} />
                      <figcaption className="text-center font-bold">{x.title}</figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* prev / next */}
      <section className="border-t border-border/50 py-10">
        <div className="sr-container grid gap-4 sm:grid-cols-2">
          {[{ p: prev, dir: "Previous panel" }, { p: next, dir: "Next panel" }].map(({ p, dir }, i) => (
            <Link key={dir} href={`/features/${p.key}`} className={`group flex items-center gap-4 rounded-2xl border border-border/60 bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 ${i ? "sm:flex-row-reverse sm:text-right" : ""}`}>
              <span className="sr-icon h-12 w-12 flex-none"><Icon name={p.icon} className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">{dir}</span><span className="block truncate text-lg font-black">{p.name}</span></span>
              <ArrowRight className={`h-5 w-5 flex-none text-primary ${i ? "sm:rotate-180" : "rotate-180"}`} />
            </Link>
          ))}
        </div>
      </section>


      <CtaBand title={`Run ${m.name} — and every other panel — free.`} lead="Every panel and every feature is included in every plan, starting free forever for one person." />
      <FaqSection topics={["AI & automation", "Data & security", "Setup"]} limit={5} />
    </>
  );
}
