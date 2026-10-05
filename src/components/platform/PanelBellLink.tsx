import Link from "next/link";
import { Bell } from "lucide-react";

/** The topbar notification icon every panel shares: a plain link to the panel's own Notifications page (no dropdown). */
export default function PanelBellLink({ href, unread = 0 }: { href: string; unread?: number }) {
  return (
    <Link
      href={href}
      title="Notifications"
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
      className="relative flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
