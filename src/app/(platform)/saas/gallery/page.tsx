import type { Metadata } from "next";
import { Suspense } from "react";
import { getGallery } from "@/lib/platform/saas/gallery";
import { Blobs, CtaBand, HeroCtas, PageHero, SectionHead } from "@/components/platform/saas/blocks";
import Gallery from "@/components/platform/saas/Gallery";
import CountStats from "@/components/platform/saas/CountStats";
import FaqSection from "@/components/platform/saas/FaqSection";
import SectionScrollNav from "@/components/platform/saas/SectionScrollNav";
import Reveal from "@/components/platform/saas/Reveal";
import Icon from "@/components/platform/saas/Icon";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SAAS_PRODUCT_COUNT } from "@/lib/platform/saas/product-routes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Product gallery",
  description: "Every real screen of SelfRun AI in one place — filter by product, search and open any screen full size.",
  alternates: { canonical: "/gallery" },
};

const NAV = [
  { id: "browse", label: "Browse the screens" },
  { id: "about", label: "What you are seeing" },
  { id: "next", label: "See it live" },
  { id: "faq", label: "FAQs" },
];

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
      <SectionScrollNav items={NAV} label="Gallery sections" numbered />
      <section id="browse" className="sr-section relative" style={{ scrollMarginTop: 140 }}>
        <Blobs />
        <div className="sr-grid-bg" aria-hidden />
        <div className="sr-container relative">
          <SectionHead n="01" icon="layers" eyebrow="Browse the screens" title="Every screen," accent="one place." lead="Pick a product on the left, search by name, and open any screen full size." />
          <Suspense fallback={null}><Gallery items={items} panels={panels} initialPanel={panel} /></Suspense>
        </div>
      </section>
      <section id="about" className="sr-section bg-muted/10" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="02" icon="check" eyebrow="What you are seeing" title="Real captures," accent="not mock-ups." lead="Everything in the gallery comes from the live product. Here is how to read it." />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: "check" as const, t: "The live product", x: "Each image is a capture of a real screen, not a drawing of what a screen might look like." },
              { icon: "file" as const, t: "A demo workspace", x: "Captured in a demo workspace with sample data, so no real company's information is shown." },
              { icon: "layers" as const, t: "Organised by product", x: "Filter by product to see every screen of one product, from its dashboard to its settings." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 70}><div className="h-full rounded-3xl border border-border/60 bg-card p-7 shadow-sm"><span className="sr-icon mb-5 h-14 w-14"><Icon name={c.icon} className="h-6 w-6" /></span><h3 className="text-xl font-black">{c.t}</h3><p className="mt-2 leading-relaxed text-muted-foreground">{c.x}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="next" className="sr-section" style={{ scrollMarginTop: 140 }}>
        <div className="sr-container">
          <SectionHead n="03" icon="rocket" eyebrow="See it live" title="Seen enough?" accent="Use it." lead="Pictures are a start. Try the real thing, or follow a guide for the screen you liked." />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { t: "Try the live demo", x: "Open the demo workspace and click around, no signup needed.", href: "/demo", c: "Open the demo" },
              { t: "Read the guides", x: "Step-by-step guides show each screen and exactly how to use it.", href: "/docs", c: "Open the docs" },
              { t: "Start free", x: "Create your own workspace. Every product is in every plan, no card needed.", href: "/signup", c: "Get started free" },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 70}><Link href={c.href} className="group flex h-full flex-col rounded-3xl border border-border/60 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"><h3 className="text-xl font-black">{c.t}</h3><p className="mt-2 flex-1 leading-relaxed text-muted-foreground">{c.x}</p><span className="mt-5 inline-flex items-center gap-2 font-bold text-primary">{c.c}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link></Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
      <FaqSection n="04" topics={["General", "Apps & devices", "Your brand"]} limit={5} />
    </>
  );
}
