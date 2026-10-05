import "server-only";
import { listNotifications, markAllRead, markRead, unreadCount, type NotificationView } from "@/lib/platform/notifications";
import {
  NOTIFICATION_MODULES,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  runAdminNotificationSweeps,
  type NotificationModule,
  type NotificationPriority,
} from "@/lib/workspace/module-notifications";
import type { WorkspaceUser } from "@/lib/workspace/access";
import { canViewCommandCenter } from "@/lib/workspace/nav";

/**
 * The Workspace's one notification feed. Two sources, one list and one bell:
 *   - "workspace": `platform_notifications` — what automations send a person;
 *   - a panel (HRMS, Projects, Procurement, Training, Team Chat): that panel's
 *     own notification store, fanned in for people who hold the Command Center
 *     permission (the feed the Command Center used to show on its own page).
 * Marking read goes back to the store the notification came from.
 */

export type NotificationSource = "workspace" | NotificationModule;

export interface WorkspaceNotification extends NotificationView {
  source: NotificationSource;
  /** Panel name for panel notifications; null for the Workspace's own. */
  sourceLabel: string | null;
  priority: NotificationPriority | null;
}

type FeedUser = WorkspaceUser & { roles: string[] };

export function isNotificationSource(value: unknown): value is NotificationSource {
  return value === "workspace" || (NOTIFICATION_MODULES as readonly unknown[]).includes(value);
}

/** Whether this person's feed includes the panels' stores. */
export async function seesPanelNotifications(user: WorkspaceUser): Promise<boolean> {
  return canViewCommandCenter({ roles: user.roles, permissionOverrides: user.permissionOverrides ?? null });
}

export async function workspaceUnreadCount(user: FeedUser): Promise<number> {
  const [own, panels] = await Promise.all([unreadCount(user.id), seesPanelNotifications(user)]);
  if (!panels) return own;
  return own + (await getAdminNotifications(user, 1).then((f) => f.unreadTotal).catch(() => 0));
}

/** Newest first. `sweep` refreshes the panels' time-based notifications first (each panel throttles itself to once an hour). */
export async function listWorkspaceNotifications(user: FeedUser, limit = 100, opts: { sweep?: boolean } = {}): Promise<WorkspaceNotification[]> {
  const panels = await seesPanelNotifications(user);
  if (panels && opts.sweep) await runAdminNotificationSweeps();
  const [own, feed] = await Promise.all([listNotifications(user.id, limit), panels ? getAdminNotifications(user, limit).catch(() => null) : Promise.resolve(null)]);
  const items: WorkspaceNotification[] = [
    ...own.map((n) => ({ ...n, source: "workspace" as const, sourceLabel: null, priority: null })),
    ...(feed?.items ?? []).map((n) => ({ id: n.id, title: n.title, body: n.body ?? "", url: n.link, read: n.read, createdAt: n.createdAt, source: n.module, sourceLabel: n.moduleLabel, priority: n.priority })),
  ];
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

/** Marks one notification read in the store it came from (always the user's own). */
export async function markWorkspaceNotificationRead(user: FeedUser, source: NotificationSource, id: string): Promise<void> {
  if (source === "workspace") {
    await markRead(user.id, id);
    return;
  }
  if (await seesPanelNotifications(user)) await markAdminNotificationRead(source, id, user.id);
}

export async function markAllWorkspaceNotificationsRead(user: FeedUser): Promise<void> {
  await markAllRead(user.id);
  if (await seesPanelNotifications(user)) await markAllAdminNotificationsRead(user);
}
