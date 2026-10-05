import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ots/OtsUi";
import CandidateTests from "@/components/ots/CandidateTests";
import { resolveTaker, basePath } from "@/lib/ots/taker";
import { candidateCards } from "@/lib/ots/candidate";

export default async function MyTestsPage() {
  const taker = await resolveTaker("staff");
  if (!taker) redirect("/ots");
  const cards = await candidateCards(taker);
  return (
    <div className="space-y-4">
      <PageHeader title="My Tests" crumbs={[{ label: "My Tests" }]} description="Tests assigned to you — pending, in progress, completed and expired." />
      <PanelListFilters>
<CandidateTests cards={cards} channel="staff" paths={basePath("staff")} />
</PanelListFilters>
    </div>
  );
}
