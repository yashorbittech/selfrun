import type { Metadata } from "next";
import { SECURITY_POINTS } from "@/lib/saas/content";
import { CtaBand, FeatureGrid, PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Security & reliability",
  description: "How SelfRun Business protects your data: strict company isolation, role-based access, audit trail, encrypted secrets and reliable operations.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <>
      <PageHero eyebrow="Security & reliability" title="Your business data, protected by design" lead="Security isn't a feature we added at the end. Isolation between companies, access control and auditing are part of how the platform stores and serves every record." />
      <section className="sr-section">
        <div className="sr-container"><FeatureGrid items={SECURITY_POINTS} /></div>
      </section>
      <CtaBand title="Questions about security?" lead="Talk to us about how the platform protects your data, or request a walkthrough." />
    </>
  );
}
