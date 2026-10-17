import { redirect } from "next/navigation";
import { PageHeader, SectionCard, Notice } from "@/components/products/evaliq/OtsUi";
import SettingsForm from "@/components/products/evaliq/SettingsForm";
import { getViewer, can } from "@/lib/products/evaliq/viewer";
import { getOtsSettings } from "@/lib/products/evaliq/settings";
import { getDirectory } from "@/lib/products/evaliq/people";
import { formatDateTime } from "@/lib/utils";

export default async function OtsSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/evaliq/login");
  if (!can(viewer, "MANAGE_SETTINGS")) redirect("/evaliq");
  const [s, dir] = await Promise.all([getOtsSettings(), getDirectory()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" crumbs={[{ label: "Settings" }]} description="Product-wide settings. Timing, attempts, marking, results and security are configured per test in the test builder." />
      <SectionCard title="Online Test System" description={s.updatedAt ? `Last changed ${formatDateTime(s.updatedAt)}` : "Using defaults"}>
        <SettingsForm
          initial={{ organizationName: s.organizationName, certificateNumberFormat: s.certificateNumberFormat, signatoryName: s.signatoryName, signatoryTitle: s.signatoryTitle, defaultValidityMonths: s.defaultValidityMonths, reminderHoursBeforeDue: s.reminderHoursBeforeDue, graceSeconds: s.graceSeconds, evaluatorUserIds: s.evaluatorUserIds }}
          users={dir.users.map((u) => ({ id: u.value, label: u.label }))}
        />
      </SectionCard>
      <Notice>
        Who can do what is managed centrally by the Super Admin at Admin → Users (roles <code>ots_admin</code>, <code>ots_manager</code>, <code>ots_author</code>, <code>ots_evaluator</code>, <code>ots_candidate</code>, plus per-permission overrides). Every HRMS employee can take tests; HR and TMS admins/managers manage them; mentors evaluate. Applicants and students take tests from the External Portal.
      </Notice>
    </div>
  );
}
