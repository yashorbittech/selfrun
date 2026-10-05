import { notFound, redirect } from "next/navigation";
import { PageHeader, SectionCard, Notice } from "@/components/ots/OtsUi";
import TestInfoForm from "@/components/ots/TestInfoForm";
import TestConfigForm from "@/components/ots/TestConfigForm";
import SectionsEditor from "@/components/ots/SectionsEditor";
import TestStepper from "@/components/ots/TestStepper";
import { getViewer, can } from "@/lib/ots/viewer";
import { getTest, effectiveTestStatus } from "@/lib/ots/tests";
import { listCategories } from "@/lib/ots/categories";
import { getDirectory } from "@/lib/ots/people";
import { getQuestionsByIds, questionFacets } from "@/lib/ots/questions";
import { testConfigValues, testInfoValues, sectionDrafts } from "@/lib/ots/test-draft";
import { QUESTION_TYPES } from "@/lib/ots/question-types";

export default async function TestBuilderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "EDIT_TEST")) redirect("/ots/tests");
  const { id } = await params;
  const { step: rawStep } = await searchParams;
  const step = rawStep === "config" || rawStep === "sections" ? rawStep : "info";
  const t = await getTest(id);
  if (!t) notFound();
  if (t.status === "archived") redirect(`/ots/tests/${id}`);
  const status = effectiveTestStatus(t);

  let body: React.ReactNode;
  if (step === "info") {
    const [cats, dir] = await Promise.all([listCategories("test"), getDirectory()]);
    body = (
      <SectionCard title="Basic information">
        <TestInfoForm id={id} initial={testInfoValues(t)} categories={cats.map((c) => ({ value: c._id, label: c.name }))} departments={dir.departments} designations={dir.designations} next={`/ots/tests/${id}/edit?step=config`} />
      </SectionCard>
    );
  } else if (step === "config") {
    body = (
      <SectionCard title="Configuration" description="Every setting applies to this test only; assignments can override dates, attempts and result visibility.">
        <TestConfigForm id={id} initial={testConfigValues(t)} next={`/ots/tests/${id}/edit?step=sections`} />
      </SectionCard>
    );
  } else {
    const [cats, facets, known] = await Promise.all([listCategories("question"), questionFacets(), getQuestionsByIds(t.sections.flatMap((s) => s.questionIds))]);
    body = (
      <SectionsEditor
        testId={id}
        initial={sectionDrafts(t)}
        known={known.map((q) => ({ id: q._id, code: q.code, prompt: q.prompt.slice(0, 200), type: q.type, typeLabel: QUESTION_TYPES[q.type].label, difficulty: q.difficulty, marks: q.marks, subject: q.subject, status: q.status }))}
        categories={cats.map((c) => ({ value: c._id, label: c.name }))}
        subjects={facets.subjects}
        next={`/ots/tests/${id}/preview`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t.name} crumbs={[{ label: "Tests", href: "/ots/tests" }, { label: t.code, href: `/ots/tests/${id}` }, { label: "Builder" }]} description={`${t.code} · test builder`} />
      <TestStepper testId={id} current={step} published={status !== "draft"} />
      {status !== "draft" && <Notice tone="warn">This test is live. Changes apply to attempts started from now on — attempts already started keep the paper and rules they began with.</Notice>}
      {body}
    </div>
  );
}
