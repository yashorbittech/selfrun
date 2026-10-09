import type { Metadata } from "next";
import LegalPage from "@/components/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/saas/site";

const doc = LEGAL_EXTRA.cookies;
export const metadata: Metadata = { title: doc.title, description: doc.description, alternates: { canonical: "/cookies" } };
export default function CookiesPage() {
  return <LegalPage doc={doc} />;
}
