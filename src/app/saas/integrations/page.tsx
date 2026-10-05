import type { Metadata } from "next";
import { INTEGRATIONS } from "@/lib/saas/content";
import { CtaBand, FeatureGrid, PageHero } from "@/components/saas/blocks";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect payments, email, AI providers, social platforms, webhooks, analytics and your own domain to SelfRun Business.",
  alternates: { canonical: "/integrations" },
};

export default function IntegrationsPage() {
  return (
    <>
      <PageHero eyebrow="Integrations" title="Connect the tools and accounts you already use" lead="Bring your own payment gateway, email provider and AI key, so cost, deliverability and policy stay with you. Anything else can be connected with signed webhooks." />
      <section className="sr-section">
        <div className="sr-container">
          <FeatureGrid items={INTEGRATIONS.map((i) => ({ title: i.name, body: i.body, icon: i.icon }))} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
