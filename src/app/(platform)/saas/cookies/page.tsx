import { pageMeta } from "@/lib/platform/saas/seo-meta";
import type { Metadata } from "next";
import LegalPage from "@/components/platform/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/platform/saas/site";

const doc = LEGAL_EXTRA.cookies;
export const metadata: Metadata = pageMeta({ path: "/cookies", title: doc.title, description: "The cookies and similar browser storage SelfRun AI uses on its website and in its products, and why. Read what each is for and how to control it.", keywords: ["cookie policy", "website cookies", "SaaS cookie policy"], tag: "Legal" });
export default function CookiesPage() {
  return <LegalPage doc={doc} />;
}
