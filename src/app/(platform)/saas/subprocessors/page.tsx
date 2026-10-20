import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { pageMeta } from "@/lib/platform/saas/seo-meta";
import { subprocessorsDoc } from "@/lib/platform/saas/legal-compliance";
import { saasContact } from "@/lib/platform/saas/brand";
import { saasCanonicalHost } from "@/lib/platform/saas/hosts";
import { requestHostOrNull } from "@/lib/platform/saas/request";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta({ path: "/subprocessors", title: "Sub-processors and International Transfers", description: "The providers SelfRun AI uses to run the service, what each one receives, and how personal data is protected when it crosses borders.", keywords: ["sub-processors", "subprocessor list", "international data transfers", "SaaS data hosting providers", "data transfer safeguards"], tag: "Legal" });

export default async function Page() {
  const c = saasContact(saasCanonicalHost(await requestHostOrNull()));
  return <LegalPage doc={subprocessorsDoc({ privacy: c.privacy, security: c.security, sales: c.sales })} />;
}
