import type { Metadata } from "next";
import LegalPage from "@/components/saas/LegalPage";
import { SAAS_BRAND } from "@/lib/saas/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the SelfRun AI website and service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const us = SAAS_BRAND.operator || SAAS_BRAND.name;
  const name = SAAS_BRAND.name;
  return (
    <LegalPage
      doc={{
        title: "Terms of Service",
        intro: <>The agreement between you and {name}, written around how the product actually works.</>,
        highlights: [
          { icon: "file", title: "You own your data", text: "You give us the right to host and process it only to provide the service." },
          { icon: "wallet", title: "Free forever for one person", text: "Every panel and every feature; paid plans add people and bigger allowances." },
          { icon: "check", title: "Cancel any time", text: "From your billing page — your workspace stays readable so you can export." },
        ],
        sections: [
          { heading: "Who we are", body: [`${name} is operated by ${us}. References to “we” and “us” in these terms are to ${us}.`] },
          { heading: "Using the service", body: [`By registering for or using ${name} you agree to these terms. You must provide accurate information, keep your credentials secure and be authorised to bind the company you register on behalf of. You are responsible for activity under your workspace, including that of the people you invite.`] },
          {
            heading: "Your workspace and your people",
            body: ["Each company has its own workspace. The owner and administrators decide which panels are switched on, invite people, and set roles and per-action permissions. The number of people depends on your plan. You are responsible for who you give access to and for removing access when someone leaves."],
          },
          {
            heading: "Plans, allowances and billing",
            body: ["Every plan includes every panel and every feature. Plans differ by the number of people and by allowances such as storage, AI usage, email, voice and custom domains; the plans, prices and allowances are shown on the pricing page and in your billing settings. Paid subscriptions renew each billing period until cancelled, and prices exclude applicable taxes. If a payment fails we give a grace period before restricting your workspace, and your data remains available to export."],
          },
          { heading: "The free plan", body: ["The Free plan is free forever for one person, with every panel and every feature, and needs no card. You can move to a paid plan when your team grows."] },
          { heading: "Your data", body: ["You own the data you put into your workspace. You give us the right to host and process it only to provide the service. You are responsible for the lawfulness of the data you upload and for the instructions you give to automations and AI features."] },
          {
            heading: "Your brand, domains and apps",
            body: ["You can put your own logo, name, colours, domain and apps on the workspace, your website and your notifications. You are responsible for the content you publish, for having the right to use your brand and domain, and for the people and visitors you invite to use them."],
          },
          {
            heading: "Automations, integrations and AI",
            body: ["Automations and webhooks do what you configure them to do, and every run is logged. You are responsible for what you automate and for the services you connect. AI features generate output from your data and instructions; review it before relying on it, particularly where it affects customers, money or legal obligations. AI usage is metered according to your plan."],
          },
          { heading: "Clients, students and visitors", body: ["You can give your own clients, students, applicants and website visitors a portal, forms, a chatbot and push notifications. They are your users: you are responsible for how you use their information and for telling them how it is used."] },
          { heading: "Acceptable use", body: ["You may not use the service to break the law, infringe others' rights, send spam, attempt to access another company's data, disrupt the service or reverse engineer it. We may suspend workspaces that put the service or other customers at risk."] },
          { heading: "Availability and support", body: ["We work to keep the service available and secure, and we provide support as described in your plan. Scheduled maintenance and events outside our control may cause interruptions."] },
          { heading: "Termination", body: ["You can cancel at any time from your billing page. We may terminate access for material breach of these terms. After termination your workspace remains readable for a period so you can export your data."] },
          { heading: "Liability", body: ["To the extent permitted by law, the service is provided as available and our aggregate liability is limited to the fees you paid in the twelve months before the claim. Nothing here limits liability that cannot be limited by law."] },
          { heading: "Changes", body: ["We may update these terms as the service evolves. We will notify you of material changes in advance, and continued use after the effective date means you accept them."] },
        ],
      }}
    />
  );
}
