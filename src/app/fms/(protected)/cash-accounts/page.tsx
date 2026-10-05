import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { Plus, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import CashAccountForm from "@/components/fms/CashAccountForm";
import { FundAccountStatusBadge } from "@/components/fms/StatusBadges";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageBanking } from "@/lib/fms-roles";
import { listCashAccounts, serializeCashAccount, totalCashBalance } from "@/lib/fms/cash-accounts";
import { formatMoney } from "@/lib/fms/constants";

export default async function CashAccountsPage() {
  const user = await getCurrentFmsUser();
  const canManage = user ? canManageBanking(user) : false;
  const [accounts, total] = await Promise.all([listCashAccounts(), totalCashBalance()]);
  const serialized = accounts.map(serializeCashAccount);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "FMS", href: "/fms" }, { label: "Cash Accounts" }]}
        title={<>Cash Accounts</>}
        description={<>{accounts.length} account{accounts.length === 1 ? "" : "s"}.</>}
        actions={<>{canManage && (
          <CashAccountForm
            trigger={
              <Button type="button" size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                New Cash Account
              </Button>
            }
          />
        )}</>}
      />

      <PanelListFilters>
<KpiGrid>
        <KpiCard label="Total Accounts" value={accounts.length} accent icon={<Coins className="size-4" />} />
        <KpiCard label="Total Cash Balance" value={<span>{formatMoney(total)}</span>} icon={<Coins className="size-4" />} />
      </KpiGrid>

      <GlassCard interactive={false}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serialized.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">No cash accounts yet.</TableCell>
                </TableRow>
              )}
              {serialized.map((a) => (
                <TableRow key={a._id}>
                  <TableCell>
                    <Link href={`/fms/cash-accounts/${a._id}`} className="font-medium text-primary hover:underline">{a.accountName}</Link>
                  </TableCell>
                  <TableCell>{a.location ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(a.currentBalance, a.currency)}</TableCell>
                  <TableCell><FundAccountStatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </GlassCard>
</PanelListFilters>
    </div>
  );
}
