import { notFound } from "next/navigation";
import { PortalPageHeader } from "@/components/portal/widgets";
import CandidateAssignment from "@/components/ots/CandidateAssignment";
import { guardPortalPage } from "@/lib/portal/guard";
import { TEST_TAKER_ROLES } from "@/lib/portal-roles";
import { resolveTaker, basePath } from "@/lib/ots/taker";
import { candidateAssignment } from "@/lib/ots/candidate";

export const dynamic = "force-dynamic";

export default async function PortalTestPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  await guardPortalPage(...TEST_TAKER_ROLES);
  const taker = await resolveTaker("portal");
  if (!taker) notFound();
  const { assignmentId } = await params;
  const data = await candidateAssignment(taker, assignmentId).catch(() => null);
  if (!data) notFound();
  return (
    <div className="space-y-5">
      <PortalPageHeader title={data.card.testName} subtitle={[data.card.testType, data.card.category].filter(Boolean).join(" · ")} />
      <CandidateAssignment data={data} channel="portal" paths={basePath("portal")} />
    </div>
  );
}
