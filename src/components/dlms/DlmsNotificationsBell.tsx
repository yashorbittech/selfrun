import PanelBellLink from "@/components/platform/PanelBellLink";
import type { DlmsBellItem } from "@/lib/dlms/notifications";


/** Links to the panel's Notifications page (the dropdown was retired). `items` is kept so topbars need no change. */
export default function DlmsNotificationsBell({ unread }: { items: DlmsBellItem[]; unread: number }) {
  return <PanelBellLink href="/dlms/notifications" unread={unread} />;
}
