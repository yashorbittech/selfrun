import PanelBellLink from "@/components/platform/PanelBellLink";
import type { OtsBellItem } from "@/lib/ots/notifications";


/** Links to the panel's Notifications page (the dropdown was retired). `items` is kept so topbars need no change. */
export default function OtsNotificationsBell({ unread }: { items: OtsBellItem[]; unread: number }) {
  return <PanelBellLink href="/ots/notifications" unread={unread} />;
}
