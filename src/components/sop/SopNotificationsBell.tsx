import PanelBellLink from "@/components/platform/PanelBellLink";
import type { SopBellItem } from "@/lib/sop/notifications";


/** Links to the panel's Notifications page (the dropdown was retired). `items` is kept so topbars need no change. */
export default function SopNotificationsBell({ unread }: { items: SopBellItem[]; unread: number }) {
  return <PanelBellLink href="/sop/notifications" unread={unread} />;
}
