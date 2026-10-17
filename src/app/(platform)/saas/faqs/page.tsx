import type { Metadata } from "next";
import { PageHero } from "@/components/platform/saas/blocks";
import FaqHub from "@/components/platform/saas/FaqHub";
import { FAQ_GROUPS } from "@/lib/platform/saas/faqs";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about SelfRun AI and verified, product-specific FAQs for all 20 business products.",
  alternates: { canonical: "/faqs" },
};

export default function FaqsPage() {
  return (
    <>
      <PageHero
        art="features"
        eyebrow="SelfRun answers"
        title="Questions about"
        accent="how it works?"
        lead="Browse system-wide guidance or choose a product for answers about its actual workflows and capabilities."
        photo="analytics"
        shot="workspace"
        shotName="SelfRun workspace"
      />
      <FaqHub
        groups={FAQ_GROUPS.map(({ id, title, href, items }) => ({
          id,
          title,
          href,
          items: items.map(({ q, a }) => ({ q, a })),
        }))}
      />
    </>
  );
}
