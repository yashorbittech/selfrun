import { pageMeta } from "@/lib/platform/saas/seo-meta";
import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/platform/saas/site";

const doc = LEGAL_EXTRA["data-policy"];
export const metadata: Metadata = pageMeta({ path: "/data-policy", title: doc.title, description: "How SelfRun AI treats the data stored in a workspace: ownership, isolation from other companies, AI processing and export. Your data stays yours.", keywords: ["data policy", "data protection SaaS", "data export and deletion", "company data ownership software"], tag: "Legal" });
export default function DataPolicyPage() {
  return <LegalPage doc={doc} />;
}
