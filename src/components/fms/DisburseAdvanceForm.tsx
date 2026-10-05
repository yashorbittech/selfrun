"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/fms/constants";
import { changeAdvanceStatusAction } from "@/app/fms/(protected)/advances/actions";
import type { FundAccountOption } from "@/lib/fms/fund-accounts";

/**
 * Disbursement previously fired directly from a bare status-transition
 * button (`AdvanceStatusActions.tsx`) with no form at all — this is the
 * minimal form the Fund Account picker retrofit needs: everything else
 * about the disbursement (amount, date) is already implied by the advance
 * record, so the only real input is which bank/cash account it pays from.
 */
export default function DisburseAdvanceForm({
  advanceId,
  amount,
  fundAccounts = [],
  trigger,
}: {
  advanceId: string;
  amount: number;
  fundAccounts?: FundAccountOption[];
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fundAccountKey, setFundAccountKey] = useState("");
  const matchingFundAccounts = fundAccounts.filter((a) => a.currency === DEFAULT_CURRENCY);

  function onOpenChange(next: boolean) {
    if (next) setFundAccountKey("");
    setOpen(next);
  }

  function submit() {
    startTransition(async () => {
      const res = await changeAdvanceStatusAction(advanceId, "disbursed", fundAccountKey || undefined);
      if (!res.ok) {
        toast.error(res.error ?? "Could not disburse the advance.");
        return;
      }
      toast.success("Advance disbursed");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={trigger as ReactElement} />
      <SheetContent className="sm:max-w-sm">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>Disburse Advance</SheetTitle>
          <SheetDescription>Amount: {formatMoney(amount)}.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {matchingFundAccounts.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Fund Account (bank/cash this pays from)</Label>
              <Select value={fundAccountKey || "none"} onValueChange={(v) => setFundAccountKey(!v || v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {matchingFundAccounts.map((a) => (
                    <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No bank/cash accounts configured yet — this will post against the payables control account.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 p-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Disburse"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
