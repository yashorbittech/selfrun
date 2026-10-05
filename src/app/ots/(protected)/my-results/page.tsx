import { redirect } from "next/navigation";
import SmmsFilterBar from "@/components/smms/SmmsFilterBar";
import { PageHeader } from "@/components/ots/OtsUi";
import CandidateHistory from "@/components/ots/CandidateHistory";
import { resolveTaker, basePath } from "@/lib/ots/taker";
import { candidateHistory } from "@/lib/ots/candidate";
import { listCategories } from "@/lib/ots/categories";

export default async function MyResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const taker = await resolveTaker("staff");
  if (!taker) redirect("/ots");
  const sp = await searchParams;
  const [rows, cats] = await Promise.all([candidateHistory(taker, sp), listCategories("test")]);
  return (
    <div className="space-y-4">
      <PageHeader title="My Results" crumbs={[{ label: "My Results" }]} description="Your complete test history — every attempt." />
      <SmmsFilterBar
        values={{ q: sp.q ?? "", status: sp.status ?? "", categoryId: sp.categoryId ?? "", from: sp.from ?? "", to: sp.to ?? "" }}
        fields={[
          { key: "q", label: "Search", type: "search", placeholder: "Test name" },
          { key: "status", label: "Result", type: "select", options: [{ value: "passed", label: "Passed" }, { value: "failed", label: "Failed" }, { value: "pending", label: "Pending / not released" }] },
          { key: "categoryId", label: "Category", type: "select", options: cats.map((c) => ({ value: c._id, label: c.name })) },
          { key: "from", label: "From", type: "date" },
          { key: "to", label: "To", type: "date" },
        ]}
      />
      <CandidateHistory rows={rows} paths={basePath("staff")} />
    </div>
  );
}
