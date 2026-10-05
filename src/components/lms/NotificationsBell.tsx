import PanelBellLink from "@/components/platform/PanelBellLink";
import type { SerializedLead, SerializedCareerApplication } from "@/components/lms/types";

/** Links to the LMS Notifications page (the dropdown was retired); the badge is the stale leads + applications count. */
export default function NotificationsBell({
  staleLeadsCount,
  staleApplicationsCount,
}: {
  staleLeads: SerializedLead[];
  staleLeadsCount: number;
  staleApplications: SerializedCareerApplication[];
  staleApplicationsCount: number;
  recentLeads: SerializedLead[];
  recentApplications: SerializedCareerApplication[];
}) {
  return <PanelBellLink href="/lms/notifications" unread={staleLeadsCount + staleApplicationsCount} />;
}
