import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { pageMeta } from "@/lib/platform/saas/seo-meta";
import { dpaDoc } from "@/lib/platform/saas/legal-compliance";
import { saasContact } from "@/lib/platform/saas/brand";
import { saasCanonicalHost } from "@/lib/platform/saas/hosts";
import { requestHostOrNull } from "@/lib/platform/saas/request";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta({ path: "/dpa", title: "Data Processing Addendum", description: "How SelfRun AI processes personal data on behalf of its customers: roles, instructions, security, sub-processors, international transfers, breach notice and deletion.", keywords: ["data processing agreement", "DPA", "GDPR data processing addendum", "processor obligations", "SaaS DPA"], tag: "Legal" });

export default async function Page() {
  const c = saasContact(saasCanonicalHost(await requestHostOrNull()));
  return <LegalPage doc={dpaDoc({ privacy: c.privacy, security: c.security, sales: c.sales })} />;
}
