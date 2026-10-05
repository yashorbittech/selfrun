import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ots/OtsUi";
import BulkQuestions from "@/components/ots/BulkQuestions";
import { getViewer, can } from "@/lib/ots/viewer";
import { listCategories } from "@/lib/ots/categories";

export default async function BulkQuestionsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "CREATE_QUESTION")) redirect("/ots/questions");
  const cats = await listCategories("question");
  return (
    <div className="space-y-4">
      <PageHeader title="Bulk Create Questions" crumbs={[{ label: "Question Bank", href: "/ots/questions" }, { label: "Bulk create" }]} description="Type or paste several objective questions at once." />
      <BulkQuestions categories={cats.map((c) => ({ value: c._id, label: c.name }))} />
    </div>
  );
}
