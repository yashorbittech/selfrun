import type { Metadata } from "next";
import LegalPage from "@/components/saas/LegalPage";
import { LEGAL_EXTRA } from "@/lib/saas/site";
import { jsonForScript } from "@/lib/security/json-script";

const doc = LEGAL_EXTRA.security;
export const metadata: Metadata = { title: doc.title, description: doc.description, alternates: { canonical: "/security" } };

/** The trust page, also published as FAQ data so a search engine or an AI assistant reading it gets each answer on its own. */
export default function SecurityPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: doc.sections.map((s) => ({ "@type": "Question", name: s.heading, acceptedAnswer: { "@type": "Answer", text: [...(s.body ?? []), ...(s.list ?? [])].join(" ") } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(ld) }} />
      <LegalPage doc={doc} />
    </>
  );
}
