import { notFound } from "next/navigation";
import "./saas.css";
import Header from "@/components/saas/Header";
import Footer from "@/components/saas/Footer";
import Interactions from "@/components/saas/Interactions";
import { OfferAdHost, OfferPopupHost, OfferTopBar } from "@/components/saas/OfferChrome";
import { onSaasHost, requestHostOrNull, saasOrigin } from "@/lib/saas/request";
import { saasCanonicalHost } from "@/lib/saas/hosts";
import { SAAS_BRAND } from "@/lib/saas/brand";
import { jsonForScript } from "@/lib/security/json-script";
import SrRoot from "@/components/saas/SrRoot";


/** The product website exists only on the product's own host; on a customer's domain this path is not a page. */
export default async function SaasLayout({ children }: { children: React.ReactNode }) {
  if (!(await onSaasHost())) notFound();
  const host = saasCanonicalHost(await requestHostOrNull());
  const origin = await saasOrigin();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SAAS_BRAND.name,
    url: origin,
    logo: `${origin}${SAAS_BRAND.assets.mark}`,
    description: SAAS_BRAND.description,
  };
  const site = { "@context": "https://schema.org", "@type": "WebSite", name: SAAS_BRAND.name, url: origin };
  // The product's own colours (light by default, dark when chosen), set on the wrapper.
  return (
    <SrRoot>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(site) }} />
      <Interactions />
      <OfferTopBar />
      <Header />
      <main>{children}</main>
      <Footer host={host} />
      <OfferAdHost />
      <OfferPopupHost />
    </SrRoot>
  );
}
