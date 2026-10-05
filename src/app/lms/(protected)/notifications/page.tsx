import GenericPanelNotificationsPage from "@/components/platform/panel/GenericPanelNotificationsPage";

export default function LmsNotificationsPage() {
  return (
    <GenericPanelNotificationsPage
      panel="lms"
      panelName="Lead Management System"
      shortCode="LMS"
      description="Track inbound lead activity, stale lead alerts & career application updates."
    />
  );
}
