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
import AssignmentForm from "@/components/tms/AssignmentForm";
import { deleteAssignmentAction } from "@/app/tms/(protected)/(staff)/assignments/actions";
import type { SerializedAssignment } from "@/lib/tms/assignments";

export default function AssignmentActions({
  assignment,
  batches,
}: {
  assignment: SerializedAssignment;
  batches: { _id: string; name: string; programName?: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteAssignmentAction(assignment._id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete assignment.");
        return;
      }
      toast.success("Assignment deleted");
      router.push("/tms/assignments");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <AssignmentForm
        assignment={assignment}
        batches={batches}
        trigger={
          <Button type="button" variant="outline" size="sm">
            <Pencil className="size-3.5" data-icon="inline-start" />
            Edit
          </Button>
        }
      />
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
            <AlertDialogTitle>Delete {assignment.title}?</AlertDialogTitle>
            <AlertDialogDescription>Soft-deleted and kept for audit history. Submissions are retained.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
