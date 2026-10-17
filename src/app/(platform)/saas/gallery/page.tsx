import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery } from "@/lib/platform/saas/gallery";
import { CtaBand, HeroCtas, PageHero } from "@/components/platform/saas/blocks";
import Gallery from "@/components/platform/saas/Gallery";
import CountStats from "@/components/platform/saas/CountStats";
import FaqSection from "@/components/platform/saas/FaqSection";
import { SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Product gallery",
  description: "Every real screen of SelfRun AI in one place — filter by product, search and open any screen full size.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ panel?: string }> }) {
  const { panel } = await searchParams;
  const { items, panels } = await getGallery();
  return (
    <>
      <PageHero art="gallery" eyebrow={`${items.length} real screens · ${SAAS_PRODUCT_COUNT} products`} title="The product," accent="every screen." lead="Not mock-ups: captures of the live product, taken in a demo workspace with sample data. Filter by product, search, and open any screen full size." photo="analytics" shot="workspace" shotName="Workspace" chip={{ title: `${items.length} screens`, text: "Captured from the real product" }}>
        <HeroCtas />
      </PageHero>
      <section className="border-b border-border/50 bg-background/60">
        <div className="sr-container"><CountStats items={[{ v: `${items.length}`, l: "real screens" }, { v: `${SAAS_PRODUCT_COUNT}`, l: "products in suite" }, { v: `${items.filter((i) => i.featured).length}`, l: "featured captures" }, { v: "0", l: "mock-ups — every one is the live product" }]} /></div>
      </section>
      <section className="sr-section pt-14">
        <div className="sr-container">
          <Suspense fallback={null}><Gallery items={items} panels={panels} initialPanel={panel} /></Suspense>
        </div>
      </section>
      <CtaBand />
      <FaqSection topics={["General", "Apps & devices", "Your brand"]} limit={5} />
    </>
  );
}
