import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { pageMeta } from "@/lib/platform/saas/seo-meta";
import { dataRequestsDoc } from "@/lib/platform/saas/legal-compliance";
import { saasContact } from "@/lib/platform/saas/brand";
import { saasCanonicalHost } from "@/lib/platform/saas/hosts";
import { requestHostOrNull } from "@/lib/platform/saas/request";
import InquiryForm from "@/components/platform/saas/InquiryForm";
export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta({ path: "/data-requests", title: "Your Data Rights and Requests", description: "How to ask SelfRun AI to access, correct, delete or export your personal information, or to object, withdraw consent or opt out, and what to expect.", keywords: ["data subject request", "GDPR access request", "delete my data", "DPDP rights", "CCPA request", "privacy request form"], tag: "Legal" });

export default async function Page() {
  const c = saasContact(saasCanonicalHost(await requestHostOrNull()));
  return <LegalPage doc={dataRequestsDoc({ privacy: c.privacy, security: c.security, sales: c.sales })} after={<InquiryForm kind="privacy" />} />;
}
