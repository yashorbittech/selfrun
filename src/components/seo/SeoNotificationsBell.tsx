import PanelBellLink from "@/components/platform/PanelBellLink";
import type { SeoBellItem } from "@/lib/seo-panel/notifications";


/** Links to the panel's Notifications page (the dropdown was retired). `items` is kept so topbars need no change. */
export default function SeoNotificationsBell({ unread }: { items: SeoBellItem[]; unread: number }) {
  return <PanelBellLink href="/seo/notifications" unread={unread} />;
}
