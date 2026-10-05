import GenericPanelNotificationsPage from "@/components/platform/panel/GenericPanelNotificationsPage";

export default function CmsNotificationsPage() {
  return (
    <GenericPanelNotificationsPage
      panel="cms"
      panelName="Content Management System"
      shortCode="CMS"
      description="Track website page updates, media uploads, navigation changes & site identity edits."
    />
  );
}
