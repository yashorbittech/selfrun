"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Send, Loader2 } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import PayoutStatusBadge from "@/components/hrms/PayoutStatusBadge";
import PayoutRowActions from "@/components/hrms/PayoutRowActions";
import { formatCurrency } from "@/lib/utils";
import { bulkInitiatePayoutsAction } from "@/app/hrms/(protected)/(staff)/payroll/actions";

interface Payout {
  _id: string;
  employeeName: string;
  employeeCode: string;
  netPayable: number;
  paymentAmount: number;
  bankAccountMasked: string;
  bankName: string | null;
  status: string;
  paymentProvider: "manual" | "razorpay";
  utr: string | null;
  failureReason: string | null;
}

export default function RunPayoutsPanel({ runId, payouts }: { runId: string; payouts: Payout[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const initiable = payouts.filter((p) => p.status === "pending");
  const allInitiableSelected = initiable.length > 0 && initiable.every((p) => selected.has(p._id));

  function bulkInitiate() {
    const ids = Array.from(selected).filter((id) => initiable.some((p) => p._id === id));
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = await bulkInitiatePayoutsAction(ids);
      toast[r.error ? "warning" : "success"](
        `${r.initiated ?? 0} payout(s) initiated${r.error ? ` · ${r.error}` : ""}`
      );
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <GlassCard interactive={false}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Salary Payouts</CardTitle>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button type="button" size="sm" disabled={pending} onClick={bulkInitiate}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" data-icon="inline-start" />}
              Initiate {selected.size}
            </Button>
          )}
          {payouts.length > 0 && (
            <a href={`/api/hrms/payroll/runs/${runId}/bank-file`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Download className="size-3.5" data-icon="inline-start" />
              Bank file
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-[55vh] overflow-auto">
        {payouts.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Payouts are created when the run is approved.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  {initiable.length > 0 && (
                    <Checkbox
                      checked={allInitiableSelected}
                      onCheckedChange={() =>
                        setSelected(allInitiableSelected ? new Set() : new Set(initiable.map((p) => p._id)))
                      }
                      aria-label="Select all initiable"
                    />
                  )}
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>UTR</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    {p.status === "pending" && (
                      <Checkbox
                        checked={selected.has(p._id)}
                        onCheckedChange={() =>
                          setSelected((prev) => {
                            const n = new Set(prev);
                            if (n.has(p._id)) n.delete(p._id);
                            else n.add(p._id);
                            return n;
                          })
                        }
                        aria-label={`Select ${p.employeeName}`}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.employeeName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{p.employeeCode}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="font-mono text-xs">{p.bankAccountMasked}</div>
                    <div className="text-[11px]">{p.bankName ?? "no bank account"}</div>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">{formatCurrency(p.paymentAmount)}</TableCell>
                  <TableCell>
                    <PayoutStatusBadge status={p.status} />
                    {p.status === "failed" && p.failureReason && (
                      <div className="mt-0.5 max-w-40 truncate text-[11px] text-destructive">{p.failureReason}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.utr ?? "—"}</TableCell>
                  <TableCell>
                    <PayoutRowActions payout={{ _id: p._id, status: p.status, employeeName: p.employeeName, provider: p.paymentProvider }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </GlassCard>
  );
}
