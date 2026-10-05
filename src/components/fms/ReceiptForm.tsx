"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PAYMENT_METHODS, SUPPORTED_CURRENCIES, formatMoney, round2, invoiceBalance } from "@/lib/fms/constants";
import { recordReceiptAction, listOutstandingInvoicesAction } from "@/app/fms/(protected)/receipts/actions";
import type { SerializedInvoice } from "@/lib/fms/invoices";
import type { FundAccountOption } from "@/lib/fms/fund-accounts";

interface Option {
  _id: string;
  label: string;
}

export default function ReceiptForm({
  customers,
  presetCustomerId,
  presetInvoiceId,
  fundAccounts = [],
  trigger,
  onSaved,
}: {
  customers: Option[];
  /** Pre-selects a customer and preloads its outstanding invoices, e.g. when triggered from a customer or invoice page. */
  presetCustomerId?: string;
  presetInvoiceId?: string;
  /** Bank/cash accounts this receipt can settle through — optional, filtered to the receipt's own currency below. */
  fundAccounts?: FundAccountOption[];
  trigger: ReactNode;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [loadingInvoices, startLoadingInvoices] = useTransition();

  const seed = () => ({
    customerId: presetCustomerId ?? "",
    receiptDate: new Date().toISOString().slice(0, 10),
    amount: "",
    method: "bank_transfer",
    transactionReference: "",
    currency: "INR",
    fundAccountKey: "",
    notes: "",
  });

  const [form, setForm] = useState(seed);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoices, setInvoices] = useState<SerializedInvoice[]>([]);
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function loadInvoices(customerId: string) {
    setInvoices([]);
    setAllocations({});
    if (!customerId) return;
    startLoadingInvoices(async () => {
      const result = await listOutstandingInvoicesAction(customerId);
      setInvoices(result);
      if (presetInvoiceId) {
        const target = result.find((i) => i._id === presetInvoiceId);
        if (target) {
          const balance = invoiceBalance(target);
          setAllocations({ [target._id]: String(balance) });
          setForm((f) => ({ ...f, amount: String(balance), currency: target.currency }));
        }
      }
    });
  }

  function onOpenChange(next: boolean) {
    if (next) {
      const s = seed();
      setForm(s);
      setErrors({});
      if (s.customerId) loadInvoices(s.customerId);
    }
    setOpen(next);
  }

  function onCustomerChange(customerId: string) {
    set("customerId", customerId);
    loadInvoices(customerId);
  }

  const allocatedTotal = round2(Object.values(allocations).reduce((s, v) => s + (Number(v) || 0), 0));

  function submit() {
    setErrors({});
    const allocationsPayload = Object.entries(allocations)
      .filter(([, v]) => Number(v) > 0)
      .map(([invoiceId, amount]) => ({ invoiceId, amount }));
    startTransition(async () => {
      const res = await recordReceiptAction({ ...form, allocations: allocationsPayload });
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success("Receipt recorded");
      setOpen(false);
      if (res.id && onSaved) onSaved(res.id);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={trigger as ReactElement} />
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>Record Payment Receipt</SheetTitle>
          <SheetDescription>Full, partial or advance payment — allocate across one or more invoices.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <Label>Customer *</Label>
            <Select value={form.customerId} onValueChange={(v) => onCustomerChange(v ?? "")} disabled={Boolean(presetCustomerId)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Receipt Date *</Label>
              <Input type="date" value={form.receiptDate} onChange={(e) => set("receiptDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount Received *</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={form.method} onValueChange={(v) => set("method", v ?? "bank_transfer")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm((f) => ({ ...f, currency: v ?? "INR", fundAccountKey: "" }))}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Transaction Reference</Label>
            <Input value={form.transactionReference} onChange={(e) => set("transactionReference", e.target.value)} />
          </div>

          {(() => {
            const matchingFundAccounts = fundAccounts.filter((a) => a.currency === form.currency);
            return (
              matchingFundAccounts.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Fund Account (bank/cash this settles through)</Label>
                  <Select value={form.fundAccountKey || "none"} onValueChange={(v) => set("fundAccountKey", !v || v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {matchingFundAccounts.map((a) => (
                        <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            );
          })()}

          <div className="space-y-2">
            <Label>Allocate to invoices</Label>
            {loadingInvoices && <p className="text-sm text-muted-foreground">Loading outstanding invoices…</p>}
            {!loadingInvoices && form.customerId && invoices.length === 0 && (
              <p className="text-sm text-muted-foreground">No outstanding invoices for this customer.</p>
            )}
            <div className="space-y-2">
              {invoices.map((inv) => {
                const balance = invoiceBalance(inv);
                return (
                  <div key={inv._id} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Outstanding: {formatMoney(balance, inv.currency)}</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={balance}
                      step="0.01"
                      value={allocations[inv._id] ?? ""}
                      onChange={(e) => setAllocations((a) => ({ ...a, [inv._id]: e.target.value }))}
                      className="w-28"
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
            {invoices.length > 0 && (
              <p className="text-right text-xs text-muted-foreground">
                Allocated: {formatMoney(allocatedTotal)} · Unallocated advance: {formatMoney(round2((Number(form.amount) || 0) - allocatedTotal))}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 p-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Record Receipt"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
