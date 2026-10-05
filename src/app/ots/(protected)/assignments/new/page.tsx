import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ots/OtsUi";
import AssignWizard from "@/components/ots/AssignWizard";
import { getViewer, can } from "@/lib/ots/viewer";
import { listTestOptions } from "@/lib/ots/tests";
import { getDirectory } from "@/lib/ots/people";
import { TARGET_TYPES, type TargetType } from "@/lib/ots/constants";

/** `?testId=…&target=applicant&id=…` pre-fills the wizard (used from applicant / student / employee pages). */
export default async function NewAssignmentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "ASSIGN_TEST")) redirect("/ots/assignments");
  const sp = await searchParams;
  const [tests, directory] = await Promise.all([listTestOptions({ assignableOnly: true }), getDirectory()]);
  const target = TARGET_TYPES.some((t) => t.value === sp.target) && sp.id ? [{ type: sp.target as TargetType, ids: [sp.id] }] : [];
  return (
    <div className="space-y-4">
      <PageHeader title="Assign Test" crumbs={[{ label: "Test Assignments", href: "/ots/assignments" }, { label: "Assign" }]} description="Assign a published test to departments, roles, employees, applicants, students, batches, courses, teams or individual users." />
      <AssignWizard tests={tests} directory={directory} initialTestId={tests.some((t) => t.value === sp.testId) ? sp.testId! : ""} initialTargets={target} />
    </div>
  );
}
