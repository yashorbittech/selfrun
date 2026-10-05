import PanelBellLink from "@/components/platform/PanelBellLink";
import type { AibotsBellItem } from "@/lib/aibots/notifications";


/** Links to the panel's Notifications page (the dropdown was retired). `items` is kept so topbars need no change. */
export default function AibotsNotificationsBell({ unread }: { items: AibotsBellItem[]; unread: number }) {
  return <PanelBellLink href="/aibots/notifications" unread={unread} />;
}
