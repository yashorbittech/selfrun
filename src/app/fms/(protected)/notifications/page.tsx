import GenericPanelNotificationsPage from "@/components/platform/panel/GenericPanelNotificationsPage";

export default function FmsNotificationsPage() {
  return (
    <GenericPanelNotificationsPage
      panel="fms"
      panelName="Financial Management System"
      shortCode="FMS"
      description="Manage financial alerts, invoice statuses, expense approvals & payment milestones."
    />
  );
}
