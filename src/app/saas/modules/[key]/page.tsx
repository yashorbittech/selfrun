import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_COPY } from "@/lib/saas/content";
import { Checklist, CtaBand, PageHero } from "@/components/saas/blocks";
import { listPanels } from "@/lib/platform/panels/store";

export const dynamic = "force-dynamic";

async function load(key: string) {
  const copy = MODULE_COPY[key];
  if (!copy || key === "website") return null;
  const panel = (await listPanels().catch(() => [])).find((p) => p.key === key && p.active);
  return panel ? { panel, copy } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const m = await load((await params).key);
  if (!m) return {};
  return { title: m.panel.name, description: `${m.copy.headline}. ${m.copy.summary}`, alternates: { canonical: `/modules/${m.panel.key}` } };
}

export default async function ModulePage({ params }: { params: Promise<{ key: string }> }) {
  const m = await load((await params).key);
  if (!m) notFound();
  const { panel, copy } = m;
  return (
    <>
      <PageHero eyebrow={panel.name} title={copy.headline} lead={copy.summary}>
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
        <Link href="/demo" className="sr-btn sr-btn-ghost">Request a demo</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container grid gap-8 lg:grid-cols-2">
          <div className="sr-card space-y-4">
            <h2 className="sr-h3">What you can do</h2>
            <Checklist items={copy.capabilities} />
          </div>
          <div className="sr-card space-y-4">
            <h2 className="sr-h3">What runs automatically</h2>
            <Checklist items={copy.automations} />
          </div>
        </div>
        <div className="sr-container mt-8">
          <div className="sr-card sr-dark space-y-2">
            <p className="sr-eyebrow" style={{ color: "#a7f3d0" }}>The result</p>
            <p className="text-xl font-semibold text-white">{copy.outcome}</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
