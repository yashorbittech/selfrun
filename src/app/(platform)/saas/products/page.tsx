import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AI_CAPABILITIES, INTEGRATIONS, SECURITY_POINTS } from "@/lib/platform/saas/content";
import { getFeatureGroups } from "@/lib/platform/saas/modules";
import { PANEL_VALUE, featureCount } from "@/lib/platform/saas/feature-lists";
import { YOUR_BRAND } from "@/lib/platform/saas/site";
import { CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import FaqSection from "@/components/platform/saas/FaqSection";
import Icon from "@/components/platform/saas/Icon";
import Reveal from "@/components/platform/saas/Reveal";
import type { IconKey } from "@/lib/platform/saas/content";
import ProductCatalog from "@/components/platform/saas/catalog/ProductCatalog";
import { productShort } from "@/lib/platform/saas/product-short";
import { productPath, SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Products",
  description:
    "Every product of SelfRun AI at a glance — CRM, HR & payroll, finance, projects, procurement, training, documents, website, AI and automation — each with a details page covering every feature.",
  alternates: { canonical: "/products" },
};

function IconList({
  items,
}: {
  items: { title: string; body: string; icon: IconKey }[];
}) {
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((x, i) => (
        <Reveal key={x.title} delay={(i % 3) * 70} className="flex gap-4">
          <span className="sr-icon h-12 w-12 flex-none">
            <Icon name={x.icon} className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-black">{x.title}</span>
            <span className="block text-sm leading-relaxed text-muted-foreground">
              {x.body}
            </span>
          </span>
        </Reveal>
      ))}
    </div>
  );
}

export default async function ProductsPage() {
  const groups = await getFeatureGroups();
  const all = groups.flatMap((g) => g.items);
  const total = all.reduce(
    (n, m) => n + (featureCount(m.key) || m.capabilities.length),
    0
  );

  return (
    <>
      <PageHero
        art="features"
        eyebrow={`${SAAS_PRODUCT_COUNT} standalone SaaS products · ${total}+ features`}
        title="Every software product."
        accent="Built for modern business."
        lead="Each product below is a complete, market-ready software engine engineered with native AI. Use and deploy products independently, or manage the suite from one place and configure the workflows you want between them."
        photo="analytics"
        shot="workspace"
        chip={{
          title: "All 20 Products Included",
          text: "Free forever plan with full access to every feature",
        }}
      >
        <HeroCtas />
      </PageHero>

      <ProductCatalog
        groups={groups.map((g) => ({ id: g.id, title: g.title, lead: g.lead }))}
        products={groups.flatMap((g) =>
          g.items.map((m) => ({
            key: m.key,
            name: m.name,
            short: productShort(m.key, m.summary),
            headline: m.headline,
            summary: m.summary,
            group: g.id,
            features: featureCount(m.key) || m.capabilities.length,
            replaces: PANEL_VALUE[m.key]?.replaces,
            benefits: PANEL_VALUE[m.key]?.benefits ?? m.capabilities,
            href: productPath(m.key),
            docsHref: `/docs#${m.key}`,
          })),
        )}
      />

      {/* Platform & Across Every Product */}
      <section
        id="platform"
        className="sr-section border-t border-border/50"
        style={{ scrollMarginTop: 140 }}
      >
        <div className="sr-container space-y-24">
          <div>
            <SectionHead
              icon="brain"
              eyebrow="Across every product"
              title="AI built into"
              accent="the whole platform."
              lead="Ask questions about your data, build assistants on your own documents, put an AI chatbot on your website, draft social posts and use AI steps inside workflows. Each AI feature respects who is asking, answers show how they were calculated, and usage is metered per plan."
            />
            <IconList items={AI_CAPABILITIES} />
          </div>
          <div>
            <SectionHead
              icon="target"
              eyebrow="White label"
              title="Your brand,"
              accent="everywhere."
              lead="Your team, your clients and your visitors see your company. Every item below is a real setting in the Workspace."
            />
            <IconList
              items={YOUR_BRAND.map((b) => ({
                title: b.title,
                body: b.text,
                icon: b.icon,
              }))}
            />
          </div>
          <div>
            <SectionHead
              icon="plug"
              eyebrow="Integrations"
              title="Connect what"
              accent="you already use."
            />
            <IconList
              items={INTEGRATIONS.map((x) => ({
                title: x.name,
                body: x.body,
                icon: x.icon,
              }))}
            />
          </div>
          <div>
            <SectionHead
              icon="shield"
              eyebrow="Security"
              title="Control and protection"
              accent="built in."
            />
            <IconList items={SECURITY_POINTS} />
            <Link href="/security" className="sr-link mt-10">
              Read how security and trust work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
      <FaqSection
        topics={[
          "AI & automation",
          "Your brand",
          "Apps & devices",
          "Data & security",
          "Setup",
        ]}
        limit={7}
        title="Questions about"
        accent="the products."
        lead="How the products, AI and automation, your own brand and apps, devices and data work."
      />
    </>
  );
}
