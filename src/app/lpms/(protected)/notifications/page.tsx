import GenericPanelNotificationsPage from "@/components/platform/panel/GenericPanelNotificationsPage";

export default function LpmsNotificationsPage() {
  return (
    <GenericPanelNotificationsPage
      panel="lpms"
      panelName="Legal & Process Management"
      shortCode="LPMS"
      description="Track legal workflow approvals, contract template changes & signature verification alerts."
    />
  );
}
