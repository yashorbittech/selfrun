import PanelListFilters from "@/components/platform/panel/PanelListFilters";
import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { Plus, Landmark, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import KpiCard from "@/components/lms/KpiCard";
import KpiGrid from "@/components/lms/KpiGrid";
import { CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import GlassCard from "@/components/lms/GlassCard";
import BankAccountForm from "@/components/fms/BankAccountForm";
import { FundAccountStatusBadge } from "@/components/fms/StatusBadges";
import { getCurrentFmsUser } from "@/lib/fms-auth";
import { canManageBanking } from "@/lib/fms-roles";
import { listBankAccounts, serializeBankAccount, totalBankBalance } from "@/lib/fms/bank-accounts";
import { formatMoney } from "@/lib/fms/constants";

export default async function BankAccountsPage() {
  const user = await getCurrentFmsUser();
  const canManage = user ? canManageBanking(user) : false;

  const [accounts, total] = await Promise.all([listBankAccounts(), totalBankBalance()]);
  const serialized = accounts.map(serializeBankAccount);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "FMS", href: "/fms" }, { label: "Bank Accounts" }]}
        title={<>Bank Accounts</>}
        description={<>{accounts.length} account{accounts.length === 1 ? "" : "s"}.</>}
        actions={<>{canManage && (
          <BankAccountForm
            trigger={
              <Button type="button" size="sm">
                <Plus className="size-3.5" data-icon="inline-start" />
                New Bank Account
              </Button>
            }
          />
        )}</>}
      />

      <PanelListFilters>
<KpiGrid>
        <KpiCard label="Total Accounts" value={accounts.length} accent icon={<Landmark className="size-4" />} />
        <KpiCard label="Total Bank Balance" value={<span>{formatMoney(total)}</span>} icon={<Coins className="size-4" />} />
      </KpiGrid>

      <GlassCard interactive={false}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Number</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serialized.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No bank accounts yet.</TableCell>
                </TableRow>
              )}
              {serialized.map((a) => (
                <TableRow key={a._id}>
                  <TableCell>
                    <Link href={`/fms/bank-accounts/${a._id}`} className="font-medium text-primary hover:underline">{a.accountName}</Link>
                  </TableCell>
                  <TableCell>{a.bankName}</TableCell>
                  <TableCell className="font-mono text-xs">{a.accountNumberMasked}</TableCell>
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
