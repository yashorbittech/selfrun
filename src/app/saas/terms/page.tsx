import type { Metadata } from "next";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you use the SelfRun Business website and service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <section className="sr-section">
      <div className="sr-container max-w-3xl">
        <h1 className="sr-h1" style={{ fontSize: "clamp(2rem,4.4vw,3rem)" }}>Terms of service</h1>
        <p className="sr-muted mt-3">The agreement between you and {SAAS_BRAND.name}.</p>
        <div className="sr-prose mt-8">
          <h2>Who we are</h2>
          <p>{SAAS_BRAND.name} is operated by {SAAS_BRAND.operator || SAAS_BRAND.name}. References to “we” and “us” in these terms are to {SAAS_BRAND.operator || SAAS_BRAND.name}.</p>
          <h2>Using the service</h2>
          <p>By registering for or using {SAAS_BRAND.name} you agree to these terms. You must provide accurate information, keep your credentials secure and be authorised to bind the company you register on behalf of. You are responsible for activity under your workspace, including that of the people you invite.</p>
          <h2>Subscriptions, trials and billing</h2>
          <p>Plans, prices, included modules, limits and trial length are shown on the pricing page and in your billing settings. Subscriptions renew each billing period until cancelled. Prices exclude applicable taxes. If a payment fails we give a grace period before restricting your workspace, and your data remains available to export.</p>
          <h2>Your data</h2>
          <p>You own the data you put into your workspace. You give us the right to host and process it only to provide the service. You are responsible for the lawfulness of the data you upload and for the instructions you give to automations and AI features.</p>
          <h2>Acceptable use</h2>
          <p>You may not use the service to break the law, infringe others&apos; rights, send spam, attempt to access another company&apos;s data, disrupt the service or reverse engineer it. We may suspend workspaces that put the service or other customers at risk.</p>
          <h2>AI features</h2>
          <p>AI features generate output from your data and instructions. Review output before relying on it, particularly where it affects customers, money or legal obligations. Usage is metered according to your plan.</p>
          <h2>Availability and support</h2>
          <p>We work to keep the service available and secure, and we provide support as described in your plan. Scheduled maintenance and events outside our control may cause interruptions.</p>
          <h2>Termination</h2>
          <p>You can cancel at any time from your billing page. We may terminate access for material breach of these terms. After termination your workspace remains readable for a period so you can export your data.</p>
          <h2>Liability</h2>
          <p>To the extent permitted by law, the service is provided as available and our aggregate liability is limited to the fees you paid in the twelve months before the claim. Nothing here limits liability that cannot be limited by law.</p>
          <h2>Changes</h2>
          <p>We may update these terms as the service evolves. We will notify you of material changes in advance, and continued use after the effective date means you accept them.</p>
          <h2>Contact</h2>
          <p>Questions about these terms can be sent through our <a href="/contact" style={{ color: "var(--sr-primary)" }}>contact page</a>.</p>
        </div>
      </div>
    </section>
  );
}
