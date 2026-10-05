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
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS } from "@/lib/hrms/time";
import { saveOrgSettingsAction } from "@/app/hrms/(protected)/(staff)/settings/actions";

interface Settings {
  workingDays: number[];
  shiftStart: string;
  shiftEnd: string;
  graceMinutes: number;
  earlyDepartureMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  timezone: string;
}

export default function OrgSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    ...settings,
    graceMinutes: String(settings.graceMinutes),
    earlyDepartureMinutes: String(settings.earlyDepartureMinutes),
    halfDayHours: String(settings.halfDayHours),
    fullDayHours: String(settings.fullDayHours),
  });
  const [workingDays, setWorkingDays] = useState<number[]>(settings.workingDays);

  function toggleDay(d: number) {
    setWorkingDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await saveOrgSettingsAction({
        workingDays,
        shiftStart: form.shiftStart,
        shiftEnd: form.shiftEnd,
        graceMinutes: form.graceMinutes,
        earlyDepartureMinutes: form.earlyDepartureMinutes,
        halfDayHours: form.halfDayHours,
        fullDayHours: form.fullDayHours,
        timezone: form.timezone,
      });
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success("Work schedule saved");
      router.refresh();
    });
  }

  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <GlassCard interactive={false}>
        <CardHeader><CardTitle>Work Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Working days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    workingDays.includes(i)
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {err("workingDays")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Shift start</Label>
              <Input type="time" value={form.shiftStart} onChange={(e) => setForm((f) => ({ ...f, shiftStart: e.target.value }))} aria-invalid={!!errors.shiftStart || undefined} />
              {err("shiftStart")}
            </div>
            <div className="space-y-1.5">
              <Label>Shift end</Label>
              <Input type="time" value={form.shiftEnd} onChange={(e) => setForm((f) => ({ ...f, shiftEnd: e.target.value }))} aria-invalid={!!errors.shiftEnd || undefined} />
              {err("shiftEnd")}
            </div>
            <div className="space-y-1.5">
              <Label>Late grace (minutes)</Label>
              <Input inputMode="numeric" value={form.graceMinutes} onChange={(e) => setForm((f) => ({ ...f, graceMinutes: e.target.value }))} aria-invalid={!!errors.graceMinutes || undefined} />
              {err("graceMinutes")}
            </div>
            <div className="space-y-1.5">
              <Label>Early-departure window (minutes)</Label>
              <Input inputMode="numeric" value={form.earlyDepartureMinutes} onChange={(e) => setForm((f) => ({ ...f, earlyDepartureMinutes: e.target.value }))} aria-invalid={!!errors.earlyDepartureMinutes || undefined} />
              {err("earlyDepartureMinutes")}
            </div>
            <div className="space-y-1.5">
              <Label>Half-day threshold (hours)</Label>
              <Input inputMode="decimal" value={form.halfDayHours} onChange={(e) => setForm((f) => ({ ...f, halfDayHours: e.target.value }))} aria-invalid={!!errors.halfDayHours || undefined} />
              {err("halfDayHours")}
            </div>
            <div className="space-y-1.5">
              <Label>Full-day hours</Label>
              <Input inputMode="decimal" value={form.fullDayHours} onChange={(e) => setForm((f) => ({ ...f, fullDayHours: e.target.value }))} aria-invalid={!!errors.fullDayHours || undefined} />
              {err("fullDayHours")}
            </div>
            <div className="space-y-1.5">
              <Label>Timezone label</Label>
              <Input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </GlassCard>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Save Schedule"}
      </Button>
    </form>
  );
}
