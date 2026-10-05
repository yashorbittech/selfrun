import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import RewardRuleForm from "@/components/lms/wallet/RewardRuleForm";
import DeleteEntityButton from "@/components/lms/offers/DeleteEntityButton";
import { getRewardRule, serializeRewardRule } from "@/lib/wallet/reward-rules";
import { REWARD_RULE_TYPE_LABELS } from "@/lib/wallet/constants";
import { deleteRewardRuleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditRewardRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await getRewardRule(id);
  if (!rule) notFound();
  return (
    <div className="space-y-4">
<PanelPageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/lms" }, { label: "Wallet", href: "/lms/wallet" }, { label: "Reward rules", href: "/lms/wallet/rules" }, { label: REWARD_RULE_TYPE_LABELS[rule.type] }]}
        title={<>{REWARD_RULE_TYPE_LABELS[rule.type]}</>}
        actions={<><DeleteEntityButton label="rule" confirmText="No further rewards of this kind will be issued for this audience. Existing ledger entries are unaffected." onDelete={deleteRewardRuleAction.bind(null, id)} redirectTo="/lms/wallet/rules" /></>}
      />
<div className="relative mx-auto max-w-2xl space-y-4">
      <GlassCard><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader><CardContent><RewardRuleForm rule={serializeRewardRule(rule)} /></CardContent></GlassCard>
    </div>
</div>
  );
}
