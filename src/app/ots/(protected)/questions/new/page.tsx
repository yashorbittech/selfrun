import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ots/OtsUi";
import QuestionEditor from "@/components/ots/QuestionEditor";
import { getViewer, can } from "@/lib/ots/viewer";
import { listCategories } from "@/lib/ots/categories";
import { questionFacets } from "@/lib/ots/questions";
import { EMPTY_DRAFT } from "@/lib/ots/question-draft";

export default async function NewQuestionPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "CREATE_QUESTION")) redirect("/ots/questions");
  const [cats, facets] = await Promise.all([listCategories("question"), questionFacets()]);
  return (
    <div className="space-y-4">
      <PageHeader title="New Question" crumbs={[{ label: "Question Bank", href: "/ots/questions" }, { label: "New" }]} description="Written once, reusable in any number of tests." />
      <QuestionEditor id={null} initial={EMPTY_DRAFT} categories={cats.map((c) => ({ value: c._id, label: c.name }))} subjects={facets.subjects} canUpload />
    </div>
  );
}
