import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { FAQS } from "@/lib/saas/content";
import { CtaBand, PageHero } from "@/components/saas/blocks";
import { jsonForScript } from "@/lib/security/json-script";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about SelfRun Business: trials, setup, AI, security, data isolation, domains, importing data and pricing.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(ld) }} />
      <PageHero eyebrow="FAQ" title="Frequently asked questions" lead="Everything people ask before they start. Can't find your answer? Talk to us." />
      <section className="sr-section">
        <div className="sr-container max-w-3xl space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="sr-faq sr-card !p-0">
              <summary className="flex items-center justify-between gap-4 p-5 text-lg font-bold">
                {f.q}
                <Plus className="sr-faq-plus size-5 flex-none transition-transform" style={{ color: "var(--sr-primary)" }} aria-hidden />
              </summary>
              <p className="sr-muted px-5 pb-5 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <CtaBand title="Still have questions?" lead="Our team is happy to answer them — or show you the platform live." />
    </>
  );
}
