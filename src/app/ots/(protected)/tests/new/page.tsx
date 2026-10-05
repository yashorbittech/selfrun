import { redirect } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/ots/OtsUi";
import TestInfoForm from "@/components/ots/TestInfoForm";
import TestStepper from "@/components/ots/TestStepper";
import { getViewer, can } from "@/lib/ots/viewer";
import { listCategories } from "@/lib/ots/categories";
import { getDirectory } from "@/lib/ots/people";
import { testInfoValues } from "@/lib/ots/test-draft";

export default async function NewTestPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "CREATE_TEST")) redirect("/ots/tests");
  const [cats, dir] = await Promise.all([listCategories("test"), getDirectory()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Create Test" crumbs={[{ label: "Tests", href: "/ots/tests" }, { label: "New" }]} description="One engine for every kind of test — employee assessments, applicant screening, student exams and certifications." />
      <TestStepper testId={null} current="info" />
      <SectionCard title="Basic information">
        <TestInfoForm id={null} initial={testInfoValues(null)} categories={cats.map((c) => ({ value: c._id, label: c.name }))} departments={dir.departments} designations={dir.designations} />
      </SectionCard>
    </div>
  );
}
