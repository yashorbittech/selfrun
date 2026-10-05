import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/seo/SeoUi";
import AuditRunSummary from "@/components/seo/AuditRunSummary";
import { getViewer } from "@/lib/seo-panel/viewer";
import { getRun } from "@/lib/seo-panel/crawler";
import { formatDateTime } from "@/lib/utils";

export default async function AuditRunPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/seo/login");
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();
  return (
    <div className="space-y-4">
      <PageHeader title={`Audit · ${formatDateTime(run.startedAt)}`} crumbs={[{ label: "Website Audit", href: "/seo/audit" }, { label: "Run" }]} description="Counts are this run's findings; the issue list always shows the current state (issues fixed since then are resolved)." />
      <AuditRunSummary run={run} />
    </div>
  );
}
