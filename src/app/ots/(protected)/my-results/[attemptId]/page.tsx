import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ots/OtsUi";
import ResultReport from "@/components/ots/ResultReport";
import { resolveTaker } from "@/lib/ots/taker";
import { candidateResult } from "@/lib/ots/attempts";

export default async function MyResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const taker = await resolveTaker("staff");
  if (!taker) redirect("/ots");
  const { attemptId } = await params;
  const view = await candidateResult(taker, attemptId).catch(() => null);
  if (!view) notFound();
  return (
    <div className="space-y-4">
      <PageHeader title={view.testName} crumbs={[{ label: "My Results", href: "/ots/my-results" }, { label: `Attempt ${view.attemptNo}` }]} description={`Attempt ${view.attemptNo}`} />
      <ResultReport view={view} />
    </div>
  );
}
