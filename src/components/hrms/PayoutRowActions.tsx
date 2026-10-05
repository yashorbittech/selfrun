"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, CircleCheck, RotateCcw, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  initiatePayoutAction,
  recordPayoutResultAction,
  retryPayoutAction,
  cancelPayoutAction,
} from "@/app/hrms/(protected)/(staff)/payroll/actions";

interface Row {
  _id: string;
  status: string;
  employeeName: string;
  provider: "manual" | "razorpay";
}

export default function PayoutRowActions({ payout }: { payout: Row }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [resultOpen, setResultOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ status: "paid", utr: "", failureReason: "", remarks: "" });

  const refresh = () => router.refresh();

  function initiate() {
    startTransition(async () => {
      const r = await initiatePayoutAction(payout._id);
      if (!r.ok) {
        toast.error(r.error ?? "Could not initiate.");
        return;
      }
      toast.success("Payout initiated");
      refresh();
    });
  }
  function retry() {
    startTransition(async () => {
      const r = await retryPayoutAction(payout._id);
      if (!r.ok) {
        toast.error(r.error ?? "Could not retry.");
        return;
      }
      toast.success("Retry started");
      refresh();
    });
  }
  function cancel() {
    startTransition(async () => {
      const r = await cancelPayoutAction(payout._id);
      if (!r.ok) {
        toast.error(r.error ?? "Could not cancel.");
        return;
      }
      toast.success("Payout cancelled");
      refresh();
    });
  }
  function submitResult() {
    setErrors({});
    startTransition(async () => {
      const r = await recordPayoutResultAction(payout._id, form);
      if (!r.ok) {
        if (r.fieldErrors) setErrors(r.fieldErrors);
        toast.error(r.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success(form.status === "paid" ? "Marked paid" : "Marked failed");
      setResultOpen(false);
      refresh();
    });
  }

  const canInitiate = payout.status === "pending";
  const canRecordResult = payout.status === "initiated" || payout.status === "processing";
  const canRetry = payout.status === "failed";
  const canCancel = payout.status === "pending" || payout.status === "failed";

  return (
    <div className="flex items-center gap-1">
      {canInitiate && (
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={initiate}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" data-icon="inline-start" />}
          Initiate
        </Button>
      )}
      {canRecordResult && (
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => { setForm({ status: "paid", utr: "", failureReason: "", remarks: "" }); setResultOpen(true); }}>
          <CircleCheck className="size-3.5" data-icon="inline-start" />
          Record result
        </Button>
      )}
      {canRetry && (
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={retry}>
          <RotateCcw className="size-3.5" data-icon="inline-start" />
          Retry
        </Button>
      )}
      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button type="button" variant="ghost" size="icon-sm" disabled={pending} aria-label="Cancel payout">
                <Ban className="size-3.5" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel {payout.employeeName}&apos;s payout?</AlertDialogTitle>
              <AlertDialogDescription>It is excluded from the run total and no payment is made.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={cancel}>Cancel Payout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Sheet open={resultOpen} onOpenChange={setResultOpen}>
        <SheetContent>
          <SheetHeader className="border-b border-border/60">
            <SheetTitle>Record payout result — {payout.employeeName}</SheetTitle>
            <SheetDescription>
              {payout.provider === "manual"
                ? "Enter the UTR after paying through your bank, or mark it failed."
                : "Manually override the provider result if needed."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-1.5">
              <Label>Result</Label>
              <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as string }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === "paid" ? (
              <div className="space-y-1.5">
                <Label>UTR / payment reference *</Label>
                <Input value={form.utr} onChange={(e) => setForm((f) => ({ ...f, utr: e.target.value }))} aria-invalid={!!errors.utr || undefined} />
                {errors.utr && <p className="text-xs text-destructive">{errors.utr}</p>}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Failure reason *</Label>
                <Input value={form.failureReason} onChange={(e) => setForm((f) => ({ ...f, failureReason: e.target.value }))} aria-invalid={!!errors.failureReason || undefined} />
                {errors.failureReason && <p className="text-xs text-destructive">{errors.failureReason}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Textarea rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
            </div>
            <Button type="button" onClick={submitResult} disabled={pending} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
