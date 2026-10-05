import { redirect } from "next/navigation";
import GenericPanelNotificationsPage from "@/components/platform/panel/GenericPanelNotificationsPage";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { listWorkspaceNotifications } from "@/lib/workspace/notifications";
import { hubMarkAllReadAction, hubMarkReadAction } from "@/app/workspace/hub-actions";

export const dynamic = "force-dynamic";

/** Updates on this person's requests (SelfRun Business replies and status changes), from the same feed the Workspace bell reads. */
export default async function SupportNotificationsPage() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  const items = (await listWorkspaceNotifications(user, 100)).filter((n) => n.url?.startsWith("/support"));

  async function markRead(entries: { id: string; meta?: string }[]) {
    "use server";
    for (const e of entries) await hubMarkReadAction(e.id, e.meta);
  }
  async function markAll() {
    "use server";
    await hubMarkAllReadAction();
  }
  return (
    <GenericPanelNotificationsPage
      panel="support"
      live
      panelName="Help & Support"
      shortCode="HELP"
      description="Replies and status updates on your requests to SelfRun Business."
      unreadEvent="hub:unread"
      initialNotifications={items.map((n) => ({ id: n.id, meta: n.source, title: n.title, body: n.body ?? "", createdAt: new Date(n.createdAt).toISOString(), read: n.read, link: n.url ?? undefined }))}
      onMarkRead={markRead}
      onMarkAllRead={markAll}
    />
  );
}
