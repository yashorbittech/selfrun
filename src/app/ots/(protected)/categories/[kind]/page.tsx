import { notFound, redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/ots/OtsUi";
import CategoriesManager from "@/components/ots/CategoriesManager";
import { getViewer, can } from "@/lib/ots/viewer";
import { listCategoriesWithUsage } from "@/lib/ots/categories";

export default async function CategoriesPage({ params }: { params: Promise<{ kind: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "MANAGE_SETTINGS")) redirect("/ots");
  const { kind: raw } = await params;
  if (raw !== "questions" && raw !== "tests") notFound();
  const kind = raw === "tests" ? "test" : "question";
  const rows = await listCategoriesWithUsage(kind);
  const title = kind === "test" ? "Test Categories" : "Question Categories";
  return (
    <div className="space-y-4">
      <PageHeader title={title} crumbs={[{ label: title }]} description={kind === "test" ? "Group tests (e.g. Technical, HR, Compliance, Course Exams) for filters, reports and candidates' test cards." : "Group questions (e.g. JavaScript, Aptitude, Communication) for search and automatic selection rules."} />
      <SectionCard title={title}>
        <CategoriesManager kind={kind} rows={rows.map((r) => ({ id: r._id, name: r.name, description: r.description, usage: r.usage }))} />
      </SectionCard>
    </div>
  );
}
