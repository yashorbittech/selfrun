"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { savePayrollProfileAction } from "@/app/hrms/(protected)/(staff)/employees/[id]/actions";
import type { SerializedPayrollProfile } from "@/lib/hrms/payroll";

interface Props {
  employeeId: string;
  profile: SerializedPayrollProfile | null;
  canEdit: boolean;
}

type Component = { name: string; amount: string };

export default function PayrollForm({ employeeId, profile, canEdit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [basic, setBasic] = useState(String(profile?.basic ?? ""));
  const [hra, setHra] = useState(String(profile?.hra ?? ""));
  const [allowances, setAllowances] = useState<Component[]>(
    profile?.allowances.map((a) => ({ name: a.name, amount: String(a.amount) })) ?? []
  );
  const [deductions, setDeductions] = useState<Component[]>(
    profile?.deductions.map((d) => ({ name: d.name, amount: String(d.amount) })) ?? []
  );
  const [pfNumber, setPfNumber] = useState(profile?.pfNumber ?? "");
  const [esiNumber, setEsiNumber] = useState(profile?.esiNumber ?? "");
  const [uan, setUan] = useState(profile?.uan ?? "");
  const [panNumber, setPanNumber] = useState(profile?.panNumber ?? "");

  const gross = useMemo(() => {
    const b = Number(basic) || 0;
    const h = Number(hra) || 0;
    const a = allowances.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    return b + h + a;
  }, [basic, hra, allowances]);
  const totalDeductions = useMemo(() => deductions.reduce((s, x) => s + (Number(x.amount) || 0), 0), [deductions]);
  const net = gross - totalDeductions;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await savePayrollProfileAction(employeeId, {
        basic: Number(basic) || 0,
        hra: Number(hra) || 0,
        allowances: allowances.map((a) => ({ name: a.name, amount: Number(a.amount) || 0 })),
        deductions: deductions.map((d) => ({ name: d.name, amount: Number(d.amount) || 0 })),
        pfNumber,
        esiNumber,
        uan,
        panNumber,
      });
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success("Payroll profile saved");
      router.refresh();
    });
  }

  const componentRows = (
    list: Component[],
    setList: (fn: (l: Component[]) => Component[]) => void,
    label: string,
    errKey: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {list.map((c, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
          <Input placeholder="Name" value={c.name} disabled={!canEdit} onChange={(e) => setList((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <Input placeholder="Amount / month" inputMode="numeric" value={c.amount} disabled={!canEdit} onChange={(e) => setList((l) => l.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} />
          {canEdit && (
            <Button type="button" variant="ghost" size="icon" onClick={() => setList((l) => l.filter((_, j) => j !== i))} aria-label="Remove">
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      ))}
      {errors[errKey] && <p className="text-xs text-destructive">{errors[errKey]}</p>}
      {canEdit && (
        <Button type="button" variant="outline" size="sm" onClick={() => setList((l) => [...l, { name: "", amount: "" }])}>
          <Plus className="size-3.5" data-icon="inline-start" />
          Add {label.toLowerCase().replace(/s$/, "")}
        </Button>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {!canEdit && (
        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          You have read-only access to payroll. Contact an HR admin to make changes.
        </div>
      )}

      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Salary Structure</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Basic (per month)</Label>
              <Input inputMode="numeric" value={basic} disabled={!canEdit} onChange={(e) => setBasic(e.target.value)} aria-invalid={!!errors.basic || undefined} />
              {errors.basic && <p className="text-xs text-destructive">{errors.basic}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>HRA (per month)</Label>
              <Input inputMode="numeric" value={hra} disabled={!canEdit} onChange={(e) => setHra(e.target.value)} aria-invalid={!!errors.hra || undefined} />
              {errors.hra && <p className="text-xs text-destructive">{errors.hra}</p>}
            </div>
          </div>
          {componentRows(allowances, setAllowances, "Allowances", "allowances")}
          {componentRows(deductions, setDeductions, "Deductions", "deductions")}

          <div className="grid gap-3 rounded-lg border border-border/60 p-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Gross / month</p>
              <p className="font-semibold text-foreground">{formatCurrency(gross)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net / month</p>
              <p className="font-semibold text-foreground">{formatCurrency(net)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual CTC</p>
              <p className="font-semibold text-foreground">{formatCurrency(gross * 12)}</p>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Statutory</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>PAN</Label>
            <Input value={panNumber} disabled={!canEdit} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
          </div>
          <div className="space-y-1.5">
            <Label>PF number</Label>
            <Input value={pfNumber} disabled={!canEdit} onChange={(e) => setPfNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ESI number</Label>
            <Input value={esiNumber} disabled={!canEdit} onChange={(e) => setEsiNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>UAN</Label>
            <Input value={uan} disabled={!canEdit} onChange={(e) => setUan(e.target.value)} />
          </div>
        </CardContent>
      </GlassCard>

      {canEdit && (
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Save Payroll Profile"}
        </Button>
      )}
    </form>
  );
}
