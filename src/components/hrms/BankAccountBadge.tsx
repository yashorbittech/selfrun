import { Badge } from "@/components/ui/badge";
import { bankVerificationMeta } from "@/lib/hrms/payout-status";

export default function BankAccountBadge({ status }: { status?: string }) {
  const meta = bankVerificationMeta(status);
  return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
}
