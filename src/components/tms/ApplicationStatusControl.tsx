"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { APPLICATION_STATUSES } from "@/lib/tms/constants";
import { setApplicationStatusAction } from "@/app/tms/(protected)/(staff)/applications/actions";

export default function ApplicationStatusControl({
  applicationId,
  status,
  locked = false,
}: {
  applicationId: string;
  status: string;
  locked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setApplicationStatusAction(applicationId, next);
      if (!result.ok) {
        toast.error(result.error ?? "Could not update status.");
        return;
      }
      toast.success("Status updated");
      router.refresh();
    });
  }

  return (
    <Select value={status} onValueChange={(v) => change(v ?? status)} disabled={locked || pending}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        {APPLICATION_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value} disabled={s.value === "enrolled" && status !== "enrolled"}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
