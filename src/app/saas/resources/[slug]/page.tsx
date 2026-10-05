import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RESOURCES } from "@/lib/saas/content";
import { CtaBand } from "@/components/saas/blocks";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = RESOURCES.find((x) => x.slug === slug);
  return r ? { title: r.title, description: r.summary, alternates: { canonical: `/resources/${r.slug}` } } : {};
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = RESOURCES.find((x) => x.slug === slug);
  if (!r) notFound();
  return (
    <>
      <section className="sr-section">
        <div className="sr-container max-w-3xl">
          <Link href="/resources" className="text-sm font-bold" style={{ color: "var(--sr-primary)" }}>← All resources</Link>
          <div className="mt-6 flex items-center gap-3"><span className="sr-chip">{r.category}</span><span className="text-sm sr-muted">{r.readMinutes} min read</span></div>
          <h1 className="sr-h1 mt-4" style={{ fontSize: "clamp(2rem,4.4vw,3rem)" }}>{r.title}</h1>
          <p className="sr-lead mt-4">{r.summary}</p>
          <article className="sr-prose mt-10">
            {r.sections.map((s) => (
              <section key={s.heading}>
                <h2>{s.heading}</h2>
                {s.body.map((p) => <p key={p}>{p}</p>)}
              </section>
            ))}
          </article>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
