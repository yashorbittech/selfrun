"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { savePayrollConfigAction } from "@/app/hrms/(protected)/(staff)/settings/actions";

interface Config {
  pfEmployeePercent: number;
  pfWageCeiling: number;
  epsPercent: number;
  pfEmployerPercent: number;
  esiEmployeePercent: number;
  esiEmployerPercent: number;
  esiGrossThreshold: number;
  professionalTaxMonthly: number;
  tdsRegime: "new" | "manual";
  financialYearStartMonth: number;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PayrollConfigForm({ config }: { config: Config }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    pfEmployeePercent: String(config.pfEmployeePercent),
    pfWageCeiling: String(config.pfWageCeiling),
    epsPercent: String(config.epsPercent),
    pfEmployerPercent: String(config.pfEmployerPercent),
    esiEmployeePercent: String(config.esiEmployeePercent),
    esiEmployerPercent: String(config.esiEmployerPercent),
    esiGrossThreshold: String(config.esiGrossThreshold),
    professionalTaxMonthly: String(config.professionalTaxMonthly),
    tdsRegime: config.tdsRegime,
    financialYearStartMonth: String(config.financialYearStartMonth),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await savePayrollConfigAction(form);
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success("Payroll configuration saved");
      router.refresh();
    });
  }

  const field = (key: keyof typeof form, label: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input inputMode="decimal" value={form[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} aria-invalid={!!errors[key] || undefined} />
      {hint && !errors[key] && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Provident Fund</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("pfEmployeePercent", "Employee PF %", "of basic (capped)")}
          {field("pfEmployerPercent", "Employer PF %", "of basic (capped)")}
          {field("epsPercent", "EPS % (part of employer PF)")}
          {field("pfWageCeiling", "PF wage ceiling (₹)", "0 to disable the cap")}
        </CardContent>
      </GlassCard>

      <GlassCard interactive={false}>
        <CardHeader><CardTitle>ESI</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {field("esiEmployeePercent", "Employee ESI %")}
          {field("esiEmployerPercent", "Employer ESI %")}
          {field("esiGrossThreshold", "Gross threshold (₹)", "ESI applies at or below")}
        </CardContent>
      </GlassCard>

      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Tax</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {field("professionalTaxMonthly", "Professional Tax / month (₹)")}
          <div className="space-y-1.5">
            <Label>TDS regime</Label>
            <Select value={form.tdsRegime} onValueChange={(v) => v && setForm((f) => ({ ...f, tdsRegime: v as "new" | "manual" }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New regime (auto)</SelectItem>
                <SelectItem value="manual">Manual only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Auto uses FY 25-26 new-regime slabs.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Financial year starts</Label>
            <Select value={form.financialYearStartMonth} onValueChange={(v) => v && setForm((f) => ({ ...f, financialYearStartMonth: v }))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </GlassCard>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Save Payroll Config"}
      </Button>
    </form>
  );
}
