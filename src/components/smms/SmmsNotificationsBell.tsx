import PanelBellLink from "@/components/platform/PanelBellLink";
import type { SmmsBellItem } from "@/lib/smms/notifications";


/** Links to the panel's Notifications page (the dropdown was retired). `items` is kept so topbars need no change. */
export default function SmmsNotificationsBell({ unread }: { items: SmmsBellItem[]; unread: number }) {
  return <PanelBellLink href="/smms/notifications" unread={unread} />;
}
