"use client";

import Link from "next/link";
import { useId } from "react";
import { Bell } from "lucide-react";
import { useNotifyState, useToastHost } from "@/lib/notify/client";
import { panelFromHref, type NotifyPanel } from "@/lib/notify/panels";
import NotificationToasts from "@/components/platform/NotificationToasts";

/**
 * The topbar notification icon every product shares: a link to the product's own Notifications page whose count is LIVE — it follows the
 * shared realtime stream (a new notification raises it at once, marking read lowers it) and starts from the server-rendered count so
 * nothing flashes. The first bell on a page also shows the "new notification" cards.
 */
export default function PanelBellLink({ href, unread = 0, panel, actor = "staff" }: { href: string; unread?: number; panel?: NotifyPanel; actor?: "staff" | "portal" }) {
  const key = panel ?? panelFromHref(href);
  const live = useNotifyState(actor);
  const id = useId();
  const host = useToastHost(id);
  const fromServer = key ? live.counts[key] : undefined;
  const count = fromServer ?? unread;
  return (
    <>
      <Link
        href={href}
        title="Notifications"
        aria-label={count > 0 ? `Notifications (${count} unread)` : "Notifications"}
        data-unread={count}
        className="relative flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
      {host && <NotificationToasts toasts={live.toasts} />}
    </>
  );
}
