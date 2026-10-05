import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CORE_FEATURES, HOW_IT_WORKS, USE_CASES, MODULE_COPY } from "@/lib/saas/content";
import { CtaBand, FeatureGrid, SectionHead } from "@/components/saas/blocks";
import Icon from "@/components/saas/Icon";
import { listPanels } from "@/lib/platform/panels/store";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const dynamic = "force-dynamic";

const STATS = [
  { value: "20+", label: "business modules in one login" },
  { value: "1", label: "database, one set of permissions" },
  { value: "24/7", label: "automations working in the background" },
  { value: "Minutes", label: "from sign-up to a running workspace" },
];

export default async function SaasHome() {
  const panels = (await listPanels().catch(() => [])).filter((p) => p.active && !p.core || p.key === "workspace");
  const modules = panels.filter((p) => MODULE_COPY[p.key] && p.key !== "website").slice(0, 12);
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="sr-hero-glow" />
        <div className="sr-grid-bg absolute inset-x-0 top-0 h-[560px] opacity-60" aria-hidden />
        <div className="sr-container relative z-10 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-4xl space-y-7 text-center">
            <span className="sr-chip">AI-powered business automation</span>
            <h1 className="sr-h1">
              The business platform that <span className="sr-gradient-text">runs itself</span>
            </h1>
            <p className="sr-lead mx-auto max-w-2xl">
              {SAAS_BRAND.name} brings sales, HR, finance, projects, procurement, training and your website into one system — and uses AI and workflow automation to do the repetitive work for you.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial <ArrowRight className="size-4" /></Link>
              <Link href="/demo" className="sr-btn sr-btn-ghost">Request a demo</Link>
            </div>
            <p className="text-sm sr-muted">Free trial on every plan · No card needed to explore</p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="sr-card text-center">
                <p className="sr-display text-3xl font-extrabold" style={{ color: "var(--sr-primary)" }}>{s.value}</p>
                <p className="mt-1 text-sm sr-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sr-section sr-section-alt">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Why SelfRun" title="Stop stitching tools together. Run on one platform." lead="Most businesses lose hours every week moving data between disconnected apps. Here everything shares one record of the truth — and the platform acts on it." />
          <FeatureGrid items={CORE_FEATURES} />
        </div>
      </section>

      <section className="sr-section">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Modules" title="Every function of your business, ready to switch on" lead="Start with what you need today. Turn on more modules as you grow — they all work together from day one." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((p) => (
              <Link key={p.key} href={`/modules/${p.key}`} className="sr-card sr-card-hover group space-y-3">
                <span className="sr-icon"><Icon name={MODULE_COPY[p.key].icon} /></span>
                <h3 className="sr-h3">{p.name}</h3>
                <p className="sr-muted leading-relaxed">{p.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--sr-primary)" }}>Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/modules" className="sr-btn sr-btn-ghost">See all modules</Link>
          </div>
        </div>
      </section>

      <section className="sr-section sr-dark">
        <div className="sr-container grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-5">
            <span className="sr-eyebrow" style={{ color: "#a7f3d0" }}>AI built in</span>
            <h2 className="sr-h2">Ask your business a question. Get an answer you can verify.</h2>
            <p className="sr-lead">Type “Which invoices are more than 30 days overdue?” and the AI plans a read-only query against your real records, respects each person&apos;s access and shows exactly how it calculated the result.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/ai" className="sr-btn sr-btn-light">Explore AI capabilities</Link>
            </div>
          </div>
          <div className="rounded-2xl border p-6 backdrop-blur" style={{ borderColor: "rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)" }}>
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#a7f3d0" }}>You asked <span className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ background: "rgba(255,255,255,.14)", color: "#fff" }}>Example</span></p>
            <p className="mt-1 text-lg font-semibold text-white">Which clients owe us more than 30 days?</p>
            <div className="mt-5 space-y-2 rounded-xl p-4 text-sm" style={{ background: "rgba(11,16,32,.55)" }}>
              <p className="font-semibold text-white">3 clients · ₹4,82,000 outstanding</p>
              <p style={{ color: "#b9c0d8" }}>Sorted by days overdue, highest first.</p>
              <p className="pt-2 text-xs" style={{ color: "#9aa3bf" }}>How this was calculated: invoices with status “unpaid”, due date more than 30 days ago, grouped by client.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sr-section">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="How it works" title="Up and running in four steps" />
          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="sr-card space-y-3">
                <span className="sr-display inline-flex size-10 items-center justify-center rounded-xl text-lg font-extrabold text-white" style={{ background: "linear-gradient(135deg, var(--sr-primary), #0f9f77)" }}>{i + 1}</span>
                <h3 className="sr-h3">{s.title}</h3>
                <p className="sr-muted leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sr-section sr-section-alt">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Use cases" title="Whole processes, automated end to end" />
          <div className="grid gap-5 md:grid-cols-3">
            {USE_CASES.slice(0, 3).map((u) => (
              <Link key={u.slug} href={`/use-cases/${u.slug}`} className="sr-card sr-card-hover space-y-3">
                <h3 className="sr-h3">{u.title}</h3>
                <p className="sr-muted leading-relaxed">{u.summary}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--sr-primary)" }}>See the workflow <ArrowRight className="size-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
