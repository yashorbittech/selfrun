import { PortalPageHeader } from "@/components/portal/widgets";
import CandidateHistory from "@/components/ots/CandidateHistory";
import PortalTestsNav from "@/components/ots/PortalTestsNav";
import SmmsFilterBar from "@/components/smms/SmmsFilterBar";
import { guardPortalPage } from "@/lib/portal/guard";
import { TEST_TAKER_ROLES } from "@/lib/portal-roles";
import { resolveTaker, basePath } from "@/lib/ots/taker";
import { candidateHistory } from "@/lib/ots/candidate";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const dynamic = "force-dynamic";
export const generateMetadata = () => brandedMetadata("Test Results · {brand} {panel:portal}");

export default async function PortalResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await guardPortalPage(...TEST_TAKER_ROLES);
  const taker = await resolveTaker("portal");
  const sp = await searchParams;
  const rows = taker ? await candidateHistory(taker, sp) : [];
  return (
    <div className="space-y-5">
      <PortalPageHeader title="My Results" subtitle="Every attempt, with scores once they are released." />
      <PortalTestsNav active="results" />
      <SmmsFilterBar
        values={{ q: sp.q ?? "", status: sp.status ?? "", from: sp.from ?? "", to: sp.to ?? "" }}
        fields={[
          { key: "q", label: "Search", type: "search", placeholder: "Test name" },
          { key: "status", label: "Result", type: "select", options: [{ value: "passed", label: "Passed" }, { value: "failed", label: "Failed" }, { value: "pending", label: "Pending / not released" }] },
          { key: "from", label: "From", type: "date" },
          { key: "to", label: "To", type: "date" },
        ]}
      />
      <CandidateHistory rows={rows} paths={basePath("portal")} />
    </div>
  );
}
