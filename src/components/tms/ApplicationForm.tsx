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
import { APPLICATION_STATUSES } from "@/lib/tms/constants";
import { saveApplicationAction } from "@/app/tms/(protected)/(staff)/applications/actions";
import type { SerializedApplication } from "@/lib/tms/applications";

type FormState = Record<string, string>;

function fromApp(a: SerializedApplication | undefined, defaultProgramId: string): FormState {
  if (!a) return { status: "new", programId: defaultProgramId, source: "Website" };
  return {
    fullName: a.fullName,
    email: a.email,
    mobile: a.mobile ?? "",
    programId: a.programId,
    source: a.source ?? "",
    college: a.college ?? "",
    graduationYear: a.graduationYear != null ? String(a.graduationYear) : "",
    message: a.message ?? "",
    status: a.status,
    notes: a.notes ?? "",
  };
}

const SOURCES = ["Website", "Referral", "Walk-in", "Campaign", "Social Media", "Campus", "Other"];

export default function ApplicationForm({
  application,
  programs,
  defaultProgramId = "",
  trigger,
  onSaved,
}: {
  application?: SerializedApplication;
  programs: { _id: string; name: string }[];
  defaultProgramId?: string;
  trigger: ReactNode;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => fromApp(application, defaultProgramId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  function onOpenChange(next: boolean) {
    if (next) {
      setForm(fromApp(application, defaultProgramId));
      setErrors({});
    }
    setOpen(next);
  }

  function submit() {
    setErrors({});
    startTransition(async () => {
      const result = await saveApplicationAction(form, application?._id);
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        toast.error(result.error ?? "Please fix the highlighted fields.");
        return;
      }
      toast.success(application ? "Application updated" : "Application added");
      setOpen(false);
      if (result.id && onSaved) onSaved(result.id);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={trigger as ReactElement} />
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>{application ? "Edit Application" : "New Application"}</SheetTitle>
          <SheetDescription>Applicant details and the program they want.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full name *</Label>
              <Input value={form.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} />
              {err("fullName")}
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={form.mobile ?? ""} onChange={(e) => set("mobile", e.target.value)} />
              {err("mobile")}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            {err("email")}
          </div>
          <div className="space-y-1.5">
            <Label>Program *</Label>
            <Select value={form.programId || ""} onValueChange={(v) => set("programId", v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select a program" /></SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("programId")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source || "Website"} onValueChange={(v) => set("source", v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || "new"} onValueChange={(v) => set("status", v ?? "new")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.filter((s) => s.value !== "enrolled").map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>College</Label>
              <Input value={form.college ?? ""} onChange={(e) => set("college", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Graduation year</Label>
              <Input type="number" value={form.graduationYear ?? ""} onChange={(e) => set("graduationYear", e.target.value)} />
              {err("graduationYear")}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={form.message ?? ""} onChange={(e) => set("message", e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Internal notes</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>

          <Button type="button" onClick={submit} disabled={pending} className="w-full">
            {pending ? <Loader2 className="size-4 animate-spin" /> : application ? "Save changes" : "Add application"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
