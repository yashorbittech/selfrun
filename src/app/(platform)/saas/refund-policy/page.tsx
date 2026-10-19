import { pageMeta } from "@/lib/platform/saas/seo-meta";
import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/platform/saas/site";

const doc = LEGAL_EXTRA["refund-policy"];
export const metadata: Metadata = pageMeta({ path: "/refund-policy", title: doc.title, description: "The free plan, cancelling a subscription and how billing questions are handled for SelfRun AI. Read how cancellation and refunds work before you subscribe.", keywords: ["refund policy", "cancellation policy SaaS", "software subscription refund"], tag: "Legal" });
export default function RefundPolicyPage() {
  return <LegalPage doc={doc} />;
}
