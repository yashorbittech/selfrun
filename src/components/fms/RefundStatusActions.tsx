"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REFUND_TRANSITIONS, getRefundStatusMeta, type RefundStatus } from "@/lib/fms/constants";
import { changeRefundStatusAction } from "@/app/fms/(protected)/refunds/actions";

export default function RefundStatusActions({ id, status }: { id: string; status: RefundStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextStates = REFUND_TRANSITIONS[status] ?? [];

  if (nextStates.length === 0) return null;

  function move(to: RefundStatus) {
    startTransition(async () => {
      const res = await changeRefundStatusAction(id, to);
      if (!res.ok) {
        toast.error(res.error ?? "Could not update status.");
        return;
      }
      toast.success(`Moved to ${getRefundStatusMeta(to).label}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {nextStates.map((to) => (
        <Button key={to} type="button" size="sm" variant={to === "failed" ? "outline" : "default"} disabled={pending} onClick={() => move(to)}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : getRefundStatusMeta(to).label}
        </Button>
      ))}
    </div>
  );
}
