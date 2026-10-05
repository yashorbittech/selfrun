import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INDUSTRIES } from "@/lib/saas/content";
import { Checklist, CtaBand, PageHero } from "@/components/saas/blocks";
import { listPanels } from "@/lib/platform/panels/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const i = INDUSTRIES.find((x) => x.slug === slug);
  return i ? { title: i.name, description: i.summary, alternates: { canonical: `/industries/${i.slug}` } } : {};
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = INDUSTRIES.find((x) => x.slug === slug);
  if (!i) notFound();
  const panels = await listPanels().catch(() => []);
  const used = i.modules.map((k) => panels.find((p) => p.key === k)).filter((p): p is NonNullable<typeof p> => Boolean(p && p.active));
  return (
    <>
      <PageHero eyebrow="Industry" title={i.name} lead={i.summary}>
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
        <Link href="/demo" className="sr-btn sr-btn-ghost">Request a demo</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container grid gap-8 lg:grid-cols-2">
          <div className="sr-card space-y-3">
            <h2 className="sr-h3">What this industry needs</h2>
            <Checklist items={i.needs} />
          </div>
          <div className="sr-card space-y-3">
            <h2 className="sr-h3">Recommended modules</h2>
            <div className="flex flex-wrap gap-2">
              {used.map((p) => <Link key={p.key} href={`/modules/${p.key}`} className="sr-chip">{p.name}</Link>)}
            </div>
            <p className="sr-muted leading-relaxed">Start with these and switch on more modules as your business grows — they all work together from day one.</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
