import type { Metadata } from "next";
import Link from "next/link";
import { AI_CAPABILITIES } from "@/lib/saas/content";
import { CtaBand, FeatureGrid, PageHero, SectionHead } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "AI capabilities",
  description: "Ask your business questions in plain language, build AI assistants on your own knowledge, create marketing content and automate with AI — all respecting who is asking.",
  alternates: { canonical: "/ai" },
};

const PRINCIPLES = [
  { title: "Grounded in your data", body: "Answers come from queries run against your real records — not from the model's imagination. If the data is not there, the assistant says so." },
  { title: "Permission-aware", body: "The AI can only use what the signed-in person is allowed to see. Sensitive fields are never offered to it." },
  { title: "Explainable", body: "Every answer lists the data it used and the filters it applied, so you can verify a number instead of trusting it blindly." },
  { title: "Read-only by default", body: "Questions run read-only queries. The assistant cannot change your records unless you build a workflow that does." },
  { title: "Metered and under your control", body: "AI usage is counted per plan, and you can bring your own AI provider key so cost and policy stay with you." },
  { title: "A person in the loop", body: "Use approvals wherever AI output should be reviewed before it reaches a customer or moves money." },
];

export default function AiPage() {
  return (
    <>
      <PageHero eyebrow="AI capabilities" title="AI that works on your business, not just on text" lead="From answering questions about your numbers to drafting content and running workflows, AI is part of every module — grounded in your own data and respecting who is asking.">
        <Link href="/signup" className="sr-btn sr-btn-primary">Start free trial</Link>
        <Link href="/demo" className="sr-btn sr-btn-ghost">See AI in a demo</Link>
      </PageHero>
      <section className="sr-section">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="What AI does for you" title="Six ways AI saves your team time" />
          <FeatureGrid items={AI_CAPABILITIES} />
        </div>
      </section>
      <section className="sr-section sr-section-alt">
        <div className="sr-container space-y-12">
          <SectionHead eyebrow="Trust" title="AI you can rely on" lead="AI in a business has to be accurate, controlled and accountable. These principles are built into how every AI feature works." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="sr-card space-y-2">
                <h3 className="sr-h3">{p.title}</h3>
                <p className="sr-muted leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title="See what AI can do for your business" />
    </>
  );
}
