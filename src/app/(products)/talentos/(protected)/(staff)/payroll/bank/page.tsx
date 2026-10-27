import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import { redirect } from "next/navigation";
import CompanyBankAccounts from "@/components/products/talentos/CompanyBankAccounts";
import { getCurrentHrmsUser } from "@/lib/hrms-auth";
import { canManagePayrollConfig, canRunPayroll } from "@/lib/hrms-roles";
import { getPayrollConfig } from "@/lib/products/talentos/payroll-config";
import { payingAccounts, suggestedAccountId } from "@/lib/products/talentos/payroll-bank";
import { getPayoutProvider } from "@/lib/products/talentos/payout-provider";
import { listBankAccounts } from "@/lib/products/cashflow-ai/bank-accounts";
import { RAZORPAYX_ACCOUNT_NAME } from "@/lib/products/cashflow-ai/payments/payouts";

export default async function PayrollBankPage() {
  const user = await getCurrentHrmsUser();
  if (!user || (!canRunPayroll(user) && !canManagePayrollConfig(user))) redirect("/talentos");
  const [allAccounts, provider] = await Promise.all([payingAccounts(), getPayoutProvider()]);
  const accounts = allAccounts.filter((a) => a.accountName !== RAZORPAYX_ACCOUNT_NAME);
  const razorpayxBalance = (await listBankAccounts()).find((a) => a.accountName === RAZORPAYX_ACCOUNT_NAME)?.currentBalance ?? 0;
  const config = await getPayrollConfig();
  const chosen = config.salaryAccountId && accounts.some((a) => a._id === config.salaryAccountId) ? config.salaryAccountId : await suggestedAccountId(accounts);

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[{ label: "TalentOS", href: "/talentos" }, { label: "Payroll", href: "/talentos/payroll" }, { label: "Company bank account" }]}
        title={<>Razorpay and bank account</>}
        description={<>Payments are made by RazorpayX. Your current account tops it up and pays government dues.</>}
      />
      <CompanyBankAccounts accounts={accounts.map((a) => ({ _id: a._id, accountName: a.accountName, bankName: a.bankName, last4: a.last4, ifsc: a.ifsc, balance: a.balance }))} salaryAccountId={chosen} connected={provider.key === "razorpay"} razorpayxBalance={razorpayxBalance} />
    </div>
  );
}
