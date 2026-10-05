import type { Metadata } from "next";
import Link from "next/link";
import { HOW_IT_WORKS } from "@/lib/saas/content";
import { CtaBand, PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "How it works",
  description: "From registration to a running workspace in four steps: choose a plan, set up your company, configure your website, AI and automations, and run your business from one place.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="From sign-up to a running business system in minutes" lead="No implementation project. A guided setup walks you through everything, and you can change any decision later.">
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container max-w-3xl">
          <ol className="space-y-6">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="sr-card flex gap-5">
                <span className="sr-display inline-flex size-12 flex-none items-center justify-center rounded-xl text-xl font-extrabold text-white" style={{ background: "linear-gradient(135deg, var(--sr-primary), #0f9f77)" }}>{i + 1}</span>
                <div className="space-y-2">
                  <h2 className="sr-h3">{s.title}</h2>
                  <p className="sr-muted leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
