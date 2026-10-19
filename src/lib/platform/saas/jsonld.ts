import { SAAS_BRAND } from "@/lib/platform/saas/brand";

const ctx = "https://schema.org";
/** Relative addresses are made absolute by the page's origin on the client side of search engines; the layout supplies it. */
export interface Crumb { name: string; path: string }

export function breadcrumbList(crumbs: Crumb[]) {
  return { "@context": ctx, "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.path })) };
}

export function webPage(o: { type?: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage" | "FAQPage" | "ProfilePage"; path: string; name: string; description: string; crumbs?: Crumb[]; about?: string }) {
  return {
    "@context": ctx,
    "@type": o.type ?? "WebPage",
    "@id": `${o.path}#webpage`,
    url: o.path,
    name: o.name,
    description: o.description,
    inLanguage: "en-IN",
    isPartOf: { "@type": "WebSite", name: SAAS_BRAND.name, url: "/" },
    publisher: { "@type": "Organization", name: SAAS_BRAND.name },
    ...(o.about ? { about: { "@type": "Thing", name: o.about } } : {}),
  };
}

/** A product as software people can use: free to start, runs in the browser and as apps. Only what the product page itself says. */
export function softwareApplication(o: { path: string; name: string; description: string; category?: string; features?: string[]; keywords?: string[] }) {
  return {
    "@context": ctx,
    "@type": "SoftwareApplication",
    "@id": `${o.path}#software`,
    name: o.name,
    url: o.path,
    description: o.description,
    applicationCategory: o.category ?? "BusinessApplication",
    operatingSystem: "Web, Android, iOS, Windows, macOS, Linux",
    ...(o.features?.length ? { featureList: o.features.slice(0, 12) } : {}),
    ...(o.keywords?.length ? { keywords: o.keywords.slice(0, 15).join(", ") } : {}),
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free plan with every product and every feature" },
    publisher: { "@type": "Organization", name: SAAS_BRAND.name, url: "/" },
  };
}

export function article(o: { path: string; title: string; description: string; date: string; author: string; image?: string; section?: string; keywords?: string[]; authorOrg?: boolean; type?: "Article" | "TechArticle" }) {
  return {
    "@context": ctx,
    "@type": o.type ?? "Article",
    "@id": `${o.path}#article`,
    mainEntityOfPage: o.path,
    headline: o.title.slice(0, 110),
    description: o.description,
    datePublished: o.date,
    dateModified: o.date,
    author: { "@type": o.authorOrg ? "Organization" : "Person", name: o.author },
    publisher: { "@type": "Organization", name: SAAS_BRAND.name, logo: { "@type": "ImageObject", url: SAAS_BRAND.assets.mark } },
    ...(o.image ? { image: [o.image] } : {}),
    ...(o.section ? { articleSection: o.section } : {}),
    ...(o.keywords?.length ? { keywords: o.keywords.join(", ") } : {}),
    inLanguage: "en-IN",
  };
}

export function howTo(o: { path: string; name: string; description: string; steps: { name: string; text: string }[]; totalMinutes?: number }) {
  return {
    "@context": ctx,
    "@type": "HowTo",
    "@id": `${o.path}#howto`,
    name: o.name,
    description: o.description,
    ...(o.totalMinutes ? { totalTime: `PT${o.totalMinutes}M` } : {}),
    step: o.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
  };
}

export function itemList(o: { name: string; items: { name: string; path: string }[] }) {
  return { "@context": ctx, "@type": "ItemList", name: o.name, numberOfItems: o.items.length, itemListElement: o.items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, url: x.path })) };
}

export function faqPage(items: { q: string; a: string }[]) {
  return { "@context": ctx, "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}
