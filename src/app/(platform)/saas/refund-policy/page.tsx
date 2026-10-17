import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/platform/saas/site";

const doc = LEGAL_EXTRA["refund-policy"];
export const metadata: Metadata = { title: doc.title, description: doc.description, alternates: { canonical: "/refund-policy" } };
export default function RefundPolicyPage() {
  return <LegalPage doc={doc} />;
}
