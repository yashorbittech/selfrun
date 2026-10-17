import { notFound } from "next/navigation";
import "./saas.css";
import Header from "@/components/platform/saas/Header";
import Footer from "@/components/platform/saas/Footer";
import Interactions from "@/components/platform/saas/Interactions";
import { OfferTopBar } from "@/components/platform/saas/OfferChrome";
import { onSaasHost, requestHostOrNull, saasOrigin } from "@/lib/platform/saas/request";
import { saasCanonicalHost } from "@/lib/platform/saas/hosts";
import { SAAS_BRAND } from "@/lib/platform/saas/brand";
import { jsonForScript } from "@/lib/security/json-script";
import FreeForeverToast from "@/components/platform/saas/FreeForeverToast";
import SrRoot from "@/components/platform/saas/SrRoot";
import SaasFloatingContact from "@/components/platform/saas/SaasFloatingContact";
import DemoAccessPopup from "@/components/platform/saas/DemoAccessPopup";


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
      <DemoAccessPopup />
      <FreeForeverToast />
      <SaasFloatingContact />
    </SrRoot>
  );
}
