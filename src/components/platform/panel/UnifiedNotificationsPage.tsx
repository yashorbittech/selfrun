import { redirect } from "next/navigation";
import GenericPanelNotificationsPage from "@/components/platform/panel/GenericPanelNotificationsPage";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { hasLevel } from "@/lib/ai/agent/access";
import { listPanelNotifications, markPanelRead } from "@/lib/notify";
import type { NotifyPanel } from "@/lib/notify/panels";

/**
 * A panel's Notifications page for panels that use the shared notification store (Finance, Leads, Legal, Website, Intelligence …).
 * Shows only THIS person's notifications of THIS panel, and only to someone whose roles open the panel.
 */
export default async function UnifiedNotificationsPage({ panel, panelName, shortCode, description }: { panel: NotifyPanel; panelName: string; shortCode: string; description: string }) {
  const user = await getCurrentHubUser();
  if (!user) redirect(`/${panel}/login`);
  if (!hasLevel(user.roles, panel, "any")) redirect(`/${panel}/login`);
  const items = await listPanelNotifications(user.id, panel, 100);

  async function markRead(entries: { id: string }[]) {
    "use server";
    const u = await getCurrentHubUser();
    if (u && hasLevel(u.roles, panel, "any")) await markPanelRead(u.id, panel, entries.map((e) => e.id));
  }
  async function markAll() {
    "use server";
    const u = await getCurrentHubUser();
    if (u && hasLevel(u.roles, panel, "any")) await markPanelRead(u.id, panel);
  }

  return (
    <GenericPanelNotificationsPage
      panel={panel}
      panelName={panelName}
      shortCode={shortCode}
      description={description}
      initialNotifications={items.map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.createdAt, read: n.read, link: n.link ?? undefined, priority: n.priority === "high" ? "high" : "normal" }))}
      onMarkRead={markRead}
      onMarkAllRead={markAll}
    />
  );
}
