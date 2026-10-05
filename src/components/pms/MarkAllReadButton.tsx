"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "@/app/pms/(protected)/notifications-actions";

export default function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" /> : <CheckCheck className="size-3.5" data-icon="inline-start" />}
      Mark all read
    </Button>
  );
}
