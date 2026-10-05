import type { Metadata } from "next";
import { jsonForScript } from "@/lib/security/json-script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

import { SiteInfoProvider } from "@/components/cms/SiteInfoContext";
import { getSiteInfo } from "@/lib/cms/site-info";
import { parseSiteInfo } from "@/lib/cms/site-info-shared";
import { siteUrl } from "@/lib/seo";
import { companySiteUrl } from "@/lib/platform/tenancy/site-url";
import { getSiteSeo, parseSiteSeo, siteMetadata } from "@/lib/cms/site-seo";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";
import { getCompanyBrand } from "@/lib/platform/branding";
import { NEUTRAL_BRAND } from "@/lib/platform/branding/types";
import { resolveSiteThemeState } from "@/lib/cms/theme-preview";
import { FALLBACK_THEME, isDefaultTokens, themeCssBlock } from "@/lib/cms/theme-shared";
import { BrandProvider } from "@/components/platform/BrandProvider";
import { PanelsProvider } from "@/components/platform/PanelsProvider";
import PanelTextSync from "@/components/platform/PanelTextSync";
import { panelMetaFor } from "@/lib/platform/panels/store";
import PlatformNoticeBanner from "@/components/platform/PlatformNoticeBanner";
import { getTracking, type TrackingSettings } from "@/lib/cms/tracking";
import { getPlatformSettings } from "@/lib/platform/settings";
import { onSaasHost, saasOrigin } from "@/lib/saas/request";
import { SAAS_BRAND } from "@/lib/saas/brand";
import { SAAS_THEME } from "@/lib/saas/theme";

function verificationMetadata(t: TrackingSettings): Metadata["verification"] {
  const other: Record<string, string[]> = {};
  const add = (name: string, content: string) => (other[name] ??= []).push(content);
  t.bingVerification.forEach((c) => add("msvalidate.01", c));
  t.verificationMeta.filter((m) => m.attr === "name").forEach((m) => add(m.name, m.content));
  return { google: t.googleSiteVerification.length ? t.googleSiteVerification : undefined, other: Object.keys(other).length ? other : undefined };
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Site-wide SEO defaults every page inherits — CMS → Settings (see lib/cms/site-seo.ts). */
export async function generateMetadata(): Promise<Metadata> {
  // The SaaS product's own website carries the product's identity, never a customer's.
  if (await onSaasHost()) {
    return {
      metadataBase: new URL(await saasOrigin()),
      title: { default: `${SAAS_BRAND.name} — ${SAAS_BRAND.tagline}`, template: `%s | ${SAAS_BRAND.name}` },
      description: SAAS_BRAND.description,
      applicationName: SAAS_BRAND.name,
      icons: { icon: [{ url: SAAS_BRAND.assets.favicon, type: "image/svg+xml" }], apple: SAAS_BRAND.assets.mark },
      openGraph: { type: "website", siteName: SAAS_BRAND.name, title: `${SAAS_BRAND.name} — ${SAAS_BRAND.tagline}`, description: SAAS_BRAND.description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SAAS_BRAND.name }] },
      twitter: { card: "summary_large_image", title: `${SAAS_BRAND.name} — ${SAAS_BRAND.tagline}`, description: SAAS_BRAND.description },
    };
  }
  // metadataBase = this company's own public site, so relative canonical / OG URLs resolve to it.
  const hasCompany = (await currentCompanyIdOrNull()) !== null;
  const [seo, origin] = hasCompany ? await Promise.all([getSiteSeo(), companySiteUrl()]) : [parseSiteSeo(null), siteUrl];
  return siteMetadata(seo, {
    metadataBase: new URL(origin),
    // Search-engine site verification: the company's own tags (CMS → Settings → Tracking).
    verification: hasCompany ? verificationMetadata(await getTracking()) : undefined,
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Brand, contact details and social links (CMS → Site Identity); site-wide structured data (CMS → Settings).
  // No company owns this host (the proxy is showing /workspace-not-found): render the bare shell.
  // On the SaaS product's host the page chrome is the product's own (bare shell + SaaS brand), not the owner company's.
  const saasHost = await onSaasHost();
  const companyId = saasHost ? null : await currentCompanyIdOrNull();
  const hasCompany = companyId !== null;
  // The Panel Registry (names, descriptions, what is switched on) as it applies to this company; never fails the page.
  const panels = hasCompany ? await panelMetaFor(companyId).catch(() => ({})) : {};
  const [siteInfo, { jsonLd }, brand] = hasCompany
    ? await Promise.all([getSiteInfo(), getSiteSeo(), getCompanyBrand()])
    : [parseSiteInfo(null), parseSiteSeo(null), NEUTRAL_BRAND];
  // The company's active theme (CMS → Themes, or the pick made in setup) — colours, fonts and corner radius
  // for the public website AND every panel. A CMS user previewing a theme sees that one instead. Never fails the page.
  const liveChatId = hasCompany ? (await getTracking()).tawkId : "";
  const themeTokens = hasCompany ? ((await resolveSiteThemeState().catch(() => null))?.tokens ?? FALLBACK_THEME) : FALLBACK_THEME;
  const themeCss = saasHost ? themeCssBlock(SAAS_THEME) : hasCompany ? themeCssBlock(themeTokens) : "";
  // Every theme but the original default gets the modern panel treatment (see globals.css `[data-ui="modern"]`).
  const modernUi = saasHost || (hasCompany && !isDefaultTokens(themeTokens));
  // Platform Panel → Platform settings: a maintenance message for every company's panels (cached; never fails the page).
  const notice = hasCompany ? ((await getPlatformSettings().catch(() => null))?.maintenanceBanner ?? "") : "";

  return (
    <html lang="en" suppressHydrationWarning data-ui={modernUi ? "modern" : undefined} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* The active theme, for the website and every panel. */}
        {themeCss && <style id="company-theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {jsonLd.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(schema) }} />
        ))}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BrandProvider brand={saasHost ? { ...NEUTRAL_BRAND, name: SAAS_BRAND.name, namePrimary: SAAS_BRAND.namePrimary, nameAccent: SAAS_BRAND.nameAccent, logoUrl: SAAS_BRAND.assets.mark } : brand}>
            <PanelsProvider panels={panels}>
              <PanelTextSync />
              <SiteInfoProvider value={{ ...siteInfo, liveChatId }}>
                {children}

                {notice && <PlatformNoticeBanner message={notice} />}
              </SiteInfoProvider>
            </PanelsProvider>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
