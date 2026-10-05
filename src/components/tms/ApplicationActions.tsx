"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import ApplicationForm from "@/components/tms/ApplicationForm";
import { deleteApplicationAction } from "@/app/tms/(protected)/(staff)/applications/actions";
import type { SerializedApplication } from "@/lib/tms/applications";

export default function ApplicationActions({
  application,
  programs,
}: {
  application: SerializedApplication;
  programs: { _id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const converted = Boolean(application.studentId);

  function remove() {
    startTransition(async () => {
      const result = await deleteApplicationAction(application._id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete application.");
        return;
      }
      toast.success("Application deleted");
      router.push("/tms/applications");
    });
  }

  return (
    <div className="flex items-center gap-2">
      {!converted && (
        <ApplicationForm
          application={application}
          programs={programs}
          trigger={
            <Button type="button" variant="outline" size="sm">
              <Pencil className="size-3.5" data-icon="inline-start" />
              Edit
            </Button>
          }
        />
      )}
      {!converted && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button type="button" variant="outline" size="sm" disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" /> : <Trash2 className="size-3.5" data-icon="inline-start" />}
                Delete
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {application.fullName}&rsquo;s application?</AlertDialogTitle>
              <AlertDialogDescription>
                It is soft-deleted and kept for audit history. Converted applications cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
