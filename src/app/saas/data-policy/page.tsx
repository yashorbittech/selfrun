import type { Metadata } from "next";
import LegalPage from "@/components/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/saas/site";

const doc = LEGAL_EXTRA["data-policy"];
export const metadata: Metadata = { title: doc.title, description: doc.description, alternates: { canonical: "/data-policy" } };
export default function DataPolicyPage() {
  return <LegalPage doc={doc} />;
}
