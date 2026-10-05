import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { PortalPageHeader } from "@/components/portal/widgets";
import CandidateTests from "@/components/ots/CandidateTests";
import PortalTestsNav from "@/components/ots/PortalTestsNav";
import { guardPortalPage } from "@/lib/portal/guard";
import { TEST_TAKER_ROLES } from "@/lib/portal-roles";
import { resolveTaker, basePath } from "@/lib/ots/taker";
import { candidateCards } from "@/lib/ots/candidate";
import { maybeSweep } from "@/lib/ots/sweep";
import { afterForCompany } from "@/lib/platform/tenancy/context";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => brandedMetadata("Tests · {brand} {panel:portal}");

export default async function PortalTestsPage() {
  const user = await guardPortalPage(...TEST_TAKER_ROLES);
  await afterForCompany(() => maybeSweep());
  const taker = await resolveTaker("portal");
  const cards = taker ? await candidateCards(taker) : [];
  return (
    <div className="space-y-5">
      <PortalPageHeader title={user.role === "job_applicant" ? "Assessments" : "Tests & Exams"} subtitle={user.role === "job_applicant" ? "Screening and technical tests for your application." : "Course, chapter, practice, mock and final exams."} />
      <PanelListFilters>
<PortalTestsNav active="tests" />
      <CandidateTests cards={cards} channel="portal" paths={basePath("portal")} emptyHint={user.role === "job_applicant" ? "If the hiring team asks you to take a test, it will appear here." : "Tests from your program will appear here."} />
</PanelListFilters>
    </div>
  );
}
