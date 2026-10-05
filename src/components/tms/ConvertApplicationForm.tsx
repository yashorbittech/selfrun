"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { convertApplicationAction } from "@/app/tms/(protected)/(staff)/applications/actions";

export interface ConvertBatchOption {
  _id: string;
  label: string;
  full: boolean;
  seatsLeft: number;
}

export default function ConvertApplicationForm({
  applicationId,
  applicantName,
  programName,
  batches,
  trigger,
}: {
  applicationId: string;
  applicantName: string;
  programName: string;
  batches: ConvertBatchOption[];
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const firstOpen = batches.find((b) => !b.full)?._id ?? "";
  const [batchId, setBatchId] = useState(firstOpen);
  const [university, setUniversity] = useState("");
  const [branch, setBranch] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onOpenChange(next: boolean) {
    if (next) {
      setBatchId(firstOpen);
      setUniversity("");
      setBranch("");
      setError(null);
    }
    setOpen(next);
  }

  function submit() {
    setError(null);
    if (!batchId) {
      setError("Select a batch to enrol the student in.");
      return;
    }
    startTransition(async () => {
      const result = await convertApplicationAction(applicationId, batchId, { university, branch });
      if (!result.ok) {
        setError(result.error ?? result.fieldErrors?.batchId ?? "Could not convert this application.");
        toast.error(result.error ?? result.fieldErrors?.batchId ?? "Could not convert.");
        return;
      }
      toast.success("Converted to student and enrolled");
      setOpen(false);
      if (result.studentId) router.push(`/tms/students/${result.studentId}`);
      else router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={trigger as ReactElement} />
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle>Convert to Student</SheetTitle>
          <SheetDescription>
            Create a student record for {applicantName} and enrol them in a {programName} batch.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <Label>Batch *</Label>
            {batches.length === 0 ? (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                No batches exist for this program yet. Create one under Batches first.
              </p>
            ) : (
              <Select value={batchId} onValueChange={(v) => setBatchId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select a batch" /></SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b._id} value={b._id} disabled={b.full}>
                      {b.label} {b.full ? "· Full" : `· ${b.seatsLeft} left`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>University</Label>
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <Button type="button" onClick={submit} disabled={pending || batches.length === 0} className="w-full">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <><GraduationCap className="size-4" data-icon="inline-start" />Convert &amp; enrol</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
