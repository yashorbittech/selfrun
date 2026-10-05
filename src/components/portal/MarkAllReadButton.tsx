"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllPortalNotificationsReadAction } from "@/app/portal/(app)/actions";

export default function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || pending}
      onClick={() => start(() => markAllPortalNotificationsReadAction().then(() => window.location.reload()))}
    >
      <CheckCheck className="size-4" /> Mark all read
    </Button>
  );
}
