"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { markNotificationsReadAction, markAllNotificationsReadAction } from "@/app/hrms/notifications-actions";

interface Item {
  _id: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

export default function NotificationList({
  items,
  page,
  totalPages,
  basePath,
}: {
  items: Item[];
  page: number;
  totalPages: number;
  basePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasUnread = items.some((i) => !i.read);

  function open(item: Item) {
    if (!item.read) {
      startTransition(() => {
        void markNotificationsReadAction([item._id]);
      });
    }
    if (item.link) router.push(item.link);
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={markAll} disabled={pending}>
            <CheckCheck className="size-3.5" data-icon="inline-start" />
            Mark all read
          </Button>
        </div>
      )}

      <GlassCard interactive={false}>
        <CardContent className="space-y-1 py-2">
          {items.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No notifications.</p>}
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => open(item)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                !item.read && "bg-primary/5"
              )}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.read ? "bg-muted-foreground/30" : "bg-primary")} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.body}</span>
                <span className="block text-[11px] text-muted-foreground/80">{formatDateTime(item.createdAt)}</span>
              </span>
            </button>
          ))}
        </CardContent>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Link href={`${basePath}?page=${Math.max(page - 1, 1)}`} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}>
              <ChevronLeft className="size-3.5" data-icon="inline-start" />
              Previous
            </Link>
            <Link href={`${basePath}?page=${Math.min(page + 1, totalPages)}`} className={buttonVariants({ variant: "outline", size: "sm" })} aria-disabled={page >= totalPages} tabIndex={page >= totalPages ? -1 : undefined}>
              Next
              <ChevronRight className="size-3.5" data-icon="inline-end" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
