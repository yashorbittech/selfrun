"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Pencil, FileDown, Wallet, Receipt, Banknote, Building2 } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
import PayslipView, { type PayslipViewData } from "@/components/hrms/PayslipView";
import RunPayoutsPanel from "@/components/hrms/RunPayoutsPanel";
import { payrollRunStatusMeta, monthLabelLong } from "@/lib/hrms/payroll-status";
import { formatCurrency } from "@/lib/utils";
import { approveRunAction, savePayslipOverridesAction } from "@/app/hrms/(protected)/(staff)/payroll/actions";

interface Line {
  name: string;
  amount: number;
}
interface Slip {
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  workingDays: number;
  lopDays: number;
  earnings: Line[];
  grossPay: number;
  deductions: Line[];
  totalDeductions: number;
  employerContributions: Line[];
  employerCost: number;
  netPay: number;
  overrides: { arrears: number; manualTds: number | null; otherDeductions: number };
  bankAccountLast4: string | null;
  bankName: string | null;
  ifsc: string | null;
}
interface Run {
  _id: string;
  month: string;
  status: string;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployerCost: number;
}
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

export default function PayrollRunDetail({ run, slips, payouts }: { run: Run; slips: Slip[]; payouts: Payout[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [viewSlip, setViewSlip] = useState<Slip | null>(null);
  const [editSlip, setEditSlip] = useState<Slip | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ arrears: "0", manualTds: "", otherDeductions: "0" });

  const meta = payrollRunStatusMeta(run.status);
  const isDraft = run.status === "draft";

  function openEdit(s: Slip) {
    setEditSlip(s);
    setErrors({});
    setForm({
      arrears: String(s.overrides.arrears),
      manualTds: s.overrides.manualTds == null ? "" : String(s.overrides.manualTds),
      otherDeductions: String(s.overrides.otherDeductions),
    });
  }

  function saveOverrides() {
    if (!editSlip) return;
    setErrors({});
    startTransition(async () => {
      const result = await savePayslipOverridesAction(editSlip._id, {
        arrears: form.arrears,
        manualTds: form.manualTds,
        otherDeductions: form.otherDeductions,
      });
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success("Payslip updated");
      setEditSlip(null);
      router.refresh();
    });
  }

  function approve() {
    startTransition(async () => {
      const result = await approveRunAction(run._id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not approve.");
        return;
      }
      toast.success("Run approved — payslips are visible and payouts are ready");
      router.refresh();
    });
  }

  const toView = (s: Slip): PayslipViewData => ({
    payslipId: s._id,
    month: run.month,
    employeeName: s.employeeName,
    employeeCode: s.employeeCode,
    workingDays: s.workingDays,
    lopDays: s.lopDays,
    earnings: s.earnings,
    grossPay: s.grossPay,
    deductions: s.deductions,
    totalDeductions: s.totalDeductions,
    employerContributions: s.employerContributions,
    employerCost: s.employerCost,
    netPay: s.netPay,
    bankAccountLast4: s.bankAccountLast4,
    bankName: s.bankName,
    ifsc: s.ifsc,
    runStatus: run.status,
  });

  return (
    <div className="space-y-4">
      <GlassCard interactive={false}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-foreground">{monthLabelLong(run.month)}</span>
            <Badge className={meta.badgeClass}>{meta.label}</Badge>
            {run.status === "paid" && <span className="text-xs text-muted-foreground">Month locked</span>}
          </div>
          {isDraft && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button type="button" size="sm" disabled={pending}><Check className="size-3.5" data-icon="inline-start" />Approve Run</Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Approve the {monthLabelLong(run.month)} run?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Payslips become visible to employees and one salary payout is created per employee. Corrections are still possible until a
                    payout is initiated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={approve}>Approve</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </GlassCard>

      <KpiGrid>
        <KpiCard label="Gross" value={run.totalGross} format="currency" icon={<Wallet className="size-4" />} />
        <KpiCard label="Deductions" value={run.totalDeductions} format="currency" icon={<Receipt className="size-4" />} />
        <KpiCard label="Net Payout" value={run.totalNet} format="currency" accent icon={<Banknote className="size-4" />} />
        <KpiCard label="Cost to Company" value={run.totalEmployerCost} format="currency" icon={<Building2 className="size-4" />} />
      </KpiGrid>

      <GlassCard interactive={false}>
        <CardContent className="max-h-[55vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>LOP</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {slips.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <button type="button" onClick={() => setViewSlip(s)} className="font-medium hover:underline">{s.employeeName}</button>
                    <div className="font-mono text-xs text-muted-foreground">{s.employeeCode}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.lopDays || "—"}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{formatCurrency(s.grossPay)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{formatCurrency(s.totalDeductions)}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatCurrency(s.netPay)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <a
                        href={`/api/hrms/payslips/${s._id}/pdf`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                        aria-label="Download payslip PDF"
                        title="Download PDF"
                      >
                        <FileDown className="size-3.5" />
                      </a>
                      {isDraft && (
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label="Adjust">
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </GlassCard>

      <RunPayoutsPanel runId={run._id} payouts={payouts} />

      <Sheet open={!!viewSlip} onOpenChange={(o) => !o && setViewSlip(null)}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader className="border-b border-border/60">
            <SheetTitle>Payslip preview</SheetTitle>
            <SheetDescription>{viewSlip?.employeeName}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">{viewSlip && <PayslipView data={toView(viewSlip)} showPrint={false} />}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editSlip} onOpenChange={(o) => !o && setEditSlip(null)}>
        <SheetContent>
          <SheetHeader className="border-b border-border/60">
            <SheetTitle>Adjust {editSlip?.employeeName}</SheetTitle>
            <SheetDescription>Overrides recompute the payslip immediately.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="space-y-1.5">
              <Label>Arrears (added to earnings)</Label>
              <Input inputMode="numeric" value={form.arrears} onChange={(e) => setForm((f) => ({ ...f, arrears: e.target.value }))} aria-invalid={!!errors.arrears || undefined} />
              {errors.arrears && <p className="text-xs text-destructive">{errors.arrears}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Manual TDS (blank = auto)</Label>
              <Input inputMode="numeric" value={form.manualTds} onChange={(e) => setForm((f) => ({ ...f, manualTds: e.target.value }))} placeholder="auto" aria-invalid={!!errors.manualTds || undefined} />
              {errors.manualTds && <p className="text-xs text-destructive">{errors.manualTds}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Other deductions</Label>
              <Input inputMode="numeric" value={form.otherDeductions} onChange={(e) => setForm((f) => ({ ...f, otherDeductions: e.target.value }))} aria-invalid={!!errors.otherDeductions || undefined} />
              {errors.otherDeductions && <p className="text-xs text-destructive">{errors.otherDeductions}</p>}
            </div>
            <Button type="button" onClick={saveOverrides} disabled={pending} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Save & Recompute"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
