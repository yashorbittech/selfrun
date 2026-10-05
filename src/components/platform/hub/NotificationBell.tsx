"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { hubUnreadCountAction } from "@/app/workspace/hub-actions";

/** Tells the bell the unread count changed (fired by the notifications page after marking read). */
export const UNREAD_EVENT = "hub:unread";

/** The Staff Hub's notification bell: unread count, refreshed when the tab regains focus. */
export default function NotificationBell({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      hubUnreadCountAction()
        .then((n) => alive && setCount(n))
        .catch(() => {});
    };
    const onSet = (e: Event) => setCount(Number((e as CustomEvent<number>).detail) || 0);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener(UNREAD_EVENT, onSet);
    return () => {
      alive = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener(UNREAD_EVENT, onSet);
    };
  }, []);

  return (
    <Link
      href="/workspace/notifications"
      id="hub-bell"
      data-unread={count}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      title="Notifications"
      className="relative flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
    >
      <Bell className="size-4" />
      {count > 0 && (
        <span id="hub-bell-count" className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
