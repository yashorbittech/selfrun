import { Badge } from "@/components/ui/badge";
import { getLeaveStatusMeta } from "@/lib/hrms/leave-status";

export default function LeaveStatusBadge({ status }: { status?: string }) {
  const meta = getLeaveStatusMeta(status);
  return (
    <Badge className={meta.badgeClass}>
      <span className={`size-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </Badge>
  );
}
