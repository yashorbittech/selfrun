import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { USE_CASES } from "@/lib/saas/content";
import { Checklist, CtaBand, PageHero } from "@/components/saas/blocks";
import { listPanels } from "@/lib/platform/panels/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const u = USE_CASES.find((x) => x.slug === slug);
  return u ? { title: u.title, description: `${u.summary} ${u.result}`, alternates: { canonical: `/use-cases/${u.slug}` } } : {};
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = USE_CASES.find((x) => x.slug === slug);
  if (!u) notFound();
  const panels = await listPanels().catch(() => []);
  const used = u.modules.map((k) => panels.find((p) => p.key === k)).filter((p): p is NonNullable<typeof p> => Boolean(p && p.active));
  return (
    <>
      <PageHero eyebrow="Use case" title={u.title} lead={u.summary}>
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
        <Link href="/use-cases" className="sr-btn sr-btn-ghost">All use cases</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container grid gap-8 lg:grid-cols-2">
          <div className="sr-card space-y-3">
            <h2 className="sr-h3">The problem</h2>
            <p className="sr-muted leading-relaxed">{u.problem}</p>
          </div>
          <div className="sr-card space-y-3">
            <h2 className="sr-h3">How it runs on SelfRun Business</h2>
            <Checklist items={u.solution} />
          </div>
        </div>
        <div className="sr-container mt-8 space-y-5">
          <h2 className="sr-h3">Modules involved</h2>
          <div className="flex flex-wrap gap-2">
            {used.map((p) => <Link key={p.key} href={`/modules/${p.key}`} className="sr-chip">{p.name}</Link>)}
          </div>
          <div className="sr-card sr-dark"><p className="sr-eyebrow" style={{ color: "#a7f3d0" }}>The result</p><p className="mt-2 text-xl font-semibold text-white">{u.result}</p></div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
