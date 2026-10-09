import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { AI_CAPABILITIES, INTEGRATIONS, SECURITY_POINTS } from "@/lib/saas/content";
import { getFeatureGroups } from "@/lib/saas/modules";
import { PANEL_VALUE, featureCount } from "@/lib/saas/feature-lists";
import { YOUR_BRAND } from "@/lib/saas/site";
import { marketingFor } from "@/lib/saas/screens";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/saas/blocks";
import FaqSection from "@/components/saas/FaqSection";
import Icon from "@/components/saas/Icon";
import Reveal from "@/components/saas/Reveal";
import type { IconKey } from "@/lib/saas/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Features",
  description: "Every panel of SelfRun AI at a glance — CRM, HR & payroll, finance, projects, procurement, training, documents, website, AI and automation — each with a details page covering every feature.",
  alternates: { canonical: "/features" },
};

function IconList({ items }: { items: { title: string; body: string; icon: IconKey }[] }) {
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((x, i) => (
        <Reveal key={x.title} delay={(i % 3) * 70} className="flex gap-4">
          <span className="sr-icon h-12 w-12 flex-none"><Icon name={x.icon} className="h-5 w-5" /></span>
          <span><span className="block font-black">{x.title}</span><span className="block text-sm leading-relaxed text-muted-foreground">{x.body}</span></span>
        </Reveal>
      ))}
    </div>
  );
}

export default async function FeaturesPage() {
  const groups = await getFeatureGroups();
  const all = groups.flatMap((g) => g.items);
  const total = all.reduce((n, m) => n + (featureCount(m.key) || m.capabilities.length), 0);
  return (
    <>
      <PageHero art="features"
        eyebrow={`${all.length} panels · ${total}+ features`}
        title="Every panel."
        accent="Every feature. One platform."
        lead="Each panel below is a complete tool for one part of your business. Open its details page to see every feature explained, how it works, who uses it and what it connects to — all included in every plan."
        photo="analytics"
        shot="workspace"
        chip={{ title: "No feature limits", text: "Every plan includes everything below" }}
      >
        <HeroCtas />
      </PageHero>

      <nav aria-label="Panel groups" className="sticky top-[76px] z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="sr-container sr-scroll-x flex gap-1.5 py-3">
          {groups.map((g) => <a key={g.id} href={`#${g.id}`} className="sr-tab inline-flex shrink-0 items-center gap-1.5"><Icon name={g.icon} className="h-3.5 w-3.5" />{g.title}</a>)}
          <a href="#platform" className="sr-tab shrink-0">Across every panel</a>
          <a href="#faq" className="sr-tab shrink-0">FAQs</a>
        </div>
      </nav>

      {groups.map((g, gi) => (
        <section key={g.id} id={g.id} className={`sr-section ${gi % 2 === 0 ? "bg-muted/10" : ""}`} style={{ scrollMarginTop: 140 }}>
          <div className="sr-container">
            <SectionHead icon={g.icon} eyebrow={`${g.items.length} ${g.items.length === 1 ? "panel" : "panels"}`} title={g.title} lead={g.lead} />
            <div className="space-y-20 lg:space-y-28">
              {g.items.map((m, i) => {
                const img = marketingFor(m.key);
                const value = PANEL_VALUE[m.key];
                const count = featureCount(m.key) || m.capabilities.length;
                return (
                  <Reveal key={m.key}>
                    <article id={m.key} style={{ scrollMarginTop: 140 }} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                      <Link href={`/features/${m.key}`} className={`group relative block ${i % 2 ? "lg:order-2" : ""}`} aria-label={`${m.name} details`}>
                        <span className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-transparent to-brand-accent/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-70" aria-hidden />
                        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] shadow-2xl shadow-primary/20 ring-1 ring-border/60 transition-transform duration-700 group-hover:-translate-y-1 group-hover:scale-[1.015]">
                          {img && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={`${m.name} — real screen`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ transform: "scale(1.2)", transformOrigin: "50% 48%" }} />
                          )}
                        </div>
                        <span className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-full bg-background py-1.5 pl-1.5 pr-4 text-xs font-bold shadow-xl ring-1 ring-border/60"><span className="sr-icon h-8 w-8 rounded-full"><Icon name={m.icon} className="h-4 w-4" /></span>{count} features</span>
                      </Link>
                      <div>
                        <p className="sr-outline mb-2 text-7xl font-black leading-none" aria-hidden>{String(i + 1).padStart(2, "0")}</p>
                        <h3 className="text-3xl font-black tracking-tight sm:text-4xl">{m.name}</h3>
                        <p className="mt-2 text-lg font-semibold text-primary">{m.headline}</p>
                        <p className="mt-4 leading-relaxed text-muted-foreground">{m.summary}</p>
                        {value && <p className="mt-4 text-sm"><span className="font-bold text-primary">Replaces · </span><span className="text-muted-foreground">{value.replaces}</span></p>}
                        <ul className="mt-6 space-y-3">
                          {(value?.benefits ?? m.capabilities).slice(0, 3).map((b) => <li key={b} className="flex gap-3 leading-snug"><span className="sr-circle mt-0.5 h-5 w-5 flex-none"><Check className="h-3 w-3" strokeWidth={3} /></span>{b}</li>)}
                        </ul>
                        <div className="mt-8 flex flex-wrap items-center gap-4">
                          <Link href={`/features/${m.key}`} className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:scale-105">View details <ArrowRight className="h-4 w-4" /></Link>
                          <Link href={`/docs#${m.key}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"><BookOpen className="h-4 w-4" />Guide</Link>
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

      <section id="platform" className="sr-section border-t border-border/50" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container space-y-24">
          <div>
            <SectionHead icon="brain" eyebrow="Across every panel" title="AI built into" accent="the whole platform." lead="Ask questions about your data, build assistants on your own documents, put an AI chatbot on your website, draft social posts and use AI steps inside workflows. Each AI feature respects who is asking, answers show how they were calculated, and usage is metered per plan." />
            <IconList items={AI_CAPABILITIES} />
          </div>
          <div>
            <SectionHead icon="target" eyebrow="White label" title="Your brand," accent="everywhere." lead="Your team, your clients and your visitors see your company. Every item below is a real setting in the Workspace." />
            <IconList items={YOUR_BRAND.map((b) => ({ title: b.title, body: b.text, icon: b.icon }))} />
          </div>
          <div>
            <SectionHead icon="plug" eyebrow="Integrations" title="Connect what" accent="you already use." />
            <IconList items={INTEGRATIONS.map((x) => ({ title: x.name, body: x.body, icon: x.icon }))} />
          </div>
          <div>
            <SectionHead icon="shield" eyebrow="Security" title="Control and protection" accent="built in." />
            <IconList items={SECURITY_POINTS} />
            <Link href="/data-policy" className="sr-link mt-10">Read the data policy <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>


      <CtaBand />
      <FaqSection topics={["AI & automation", "Your brand", "Apps & devices", "Data & security", "Setup"]} limit={7} title="Questions about" accent="the features." lead="How the panels, AI and automation, your own brand and apps, devices and data work." />
    </>
  );
}
