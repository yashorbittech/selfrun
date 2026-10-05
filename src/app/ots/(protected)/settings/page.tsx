import { redirect } from "next/navigation";
import { PageHeader, SectionCard, Notice } from "@/components/ots/OtsUi";
import SettingsForm from "@/components/ots/SettingsForm";
import { getViewer, can } from "@/lib/ots/viewer";
import { getOtsSettings } from "@/lib/ots/settings";
import { getDirectory } from "@/lib/ots/people";
import { formatDateTime } from "@/lib/utils";

export default async function OtsSettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/ots/login");
  if (!can(viewer, "MANAGE_SETTINGS")) redirect("/ots");
  const [s, dir] = await Promise.all([getOtsSettings(), getDirectory()]);
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" crumbs={[{ label: "Settings" }]} description="Panel-wide settings. Timing, attempts, marking, results and security are configured per test in the test builder." />
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
