import { redirect } from "next/navigation";
import { getCurrentChatUser } from "@/lib/messenger-auth";
import { hasMessengerAccess } from "@/lib/messenger-roles";
import { ensureChatUser } from "@/lib/messenger/users";
import { heartbeat } from "@/lib/messenger/presence";
import { listNotifications, unreadCount, unreadSummary } from "@/lib/messenger/notifications";
import { runAnnouncementSweep } from "@/lib/messenger/announcements";
import { runMeetingSweep } from "@/lib/messenger/meetings";
import { runCallSweep } from "@/lib/messenger/calls";
import MessengerSidebarShell from "@/components/messenger/MessengerSidebarShell";
import MessengerTopbar from "@/components/messenger/MessengerTopbar";
import { RealtimeProvider } from "@/components/messenger/RealtimeProvider";
import { CallProvider } from "@/components/messenger/call/CallProvider";
import { SidebarCollapseProvider } from "@/components/lms/SidebarCollapseContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { brandedMetadata } from "@/lib/platform/branding/metadata";
import PanelBackBar from "@/components/hub/PanelBackBar";

export const generateMetadata = () => brandedMetadata("{brand} {panel:messenger}", { robots: { index: false, follow: false } });

export default async function ProtectedMessengerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentChatUser();
  if (!user) redirect("/messenger/login");
  if (user.mustChangePassword) redirect("/messenger/change-password");
  // `hasMessengerAccess` is the coarse panel-access tier gate, not a fine-grained
  // capability predicate (see `messenger-roles.ts`) — deliberately NOT Super-
  // Admin-permission-override-aware. An override can only add/remove capability
  // for a user who already clears this gate via a real role; it can never let
  // a logged-in identity with zero Team Chat roles into the panel at all.
  if (!hasMessengerAccess(user.roles)) redirect("/messenger/login");

  await ensureChatUser(user);
  await heartbeat(user.id).catch(() => {});
  // Internally throttled sweeps — publish due scheduled announcements, flip
  // meetings live/ended, fire meeting reminders.
  await Promise.all([runAnnouncementSweep(), runMeetingSweep(), runCallSweep()]);

  const [notifications, unread, summary] = await Promise.all([
    listNotifications(user.id, 10),
    unreadCount(user.id),
    unreadSummary(user.id),
  ]);

  return (
    <TooltipProvider delay={200}>
      <RealtimeProvider>
        <CallProvider currentUserId={user.id}>
        <SidebarCollapseProvider>
          <div className="lms-shell relative flex h-screen gap-3 overflow-hidden bg-canvas p-3">
            <div className="lms-ambient pointer-events-none absolute inset-0 overflow-hidden">
              <div className="lms-ambient-mid" />
              <div className="absolute inset-0 bg-grid-slate-900/[0.015] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
            </div>

            <MessengerSidebarShell
              email={user.email}
              displayName={user.displayName}
              roles={user.roles}
              permissionOverrides={user.permissionOverrides}
              createdAt={user.createdAt.toISOString()}
              lastLoginAt={user.lastLoginAt ? user.lastLoginAt.toISOString() : null}
              unreadDms={summary.dms}
              unreadChannels={summary.channels}
              unreadNotifications={unread}
            />

            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-3">
              <div className="lms-surface relative z-30 shrink-0 rounded-3xl border border-border/40 bg-background/95 shadow-none backdrop-blur-md dark:bg-card/85">
                <MessengerTopbar
                  roles={user.roles}
                  allRoles={user.allRoles}
                  unreadDms={summary.dms}
                  unreadChannels={summary.channels}
                  notifications={notifications.map((n) => ({
                    _id: n._id,
                    type: n.type,
                    title: n.title,
                    body: n.body,
                    link: n.link,
                    createdAt: n.createdAt.toISOString(),
                    read: n.read,
                  }))}
                  unread={unread}
                />
              </div>
              <PanelBackBar />
              <main className="min-h-0 flex-1 overflow-hidden rounded-2xl">{children}</main>
            </div>
          </div>
        </SidebarCollapseProvider>
        </CallProvider>
      </RealtimeProvider>
      <Toaster position="top-right" richColors closeButton />
    </TooltipProvider>
  );
}
