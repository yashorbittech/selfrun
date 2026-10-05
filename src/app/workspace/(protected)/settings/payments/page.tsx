import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { getPaymentAccountView } from "@/lib/platform/integrations/payments";
import PaymentAccountManager from "@/components/platform/PaymentAccountManager";
import { disconnectPaymentAccountAction, savePaymentAccountAction, testPaymentAccountAction } from "./actions";

export const metadata: Metadata = { title: "Payments & payouts", robots: { index: false, follow: false } };

export default async function PaymentsSettingsPage() {
  const user = await getCurrentHubUser();
  if (!user) redirect("/workspace/login");
  if (!user.roles.includes("super_admin")) redirect("/workspace");
  const account = await getPaymentAccountView();

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Payments & payouts" }]}
          title={<>Payments &amp; payouts</>}
          description={<>Connect your own Razorpay account to collect online payments from your customers and, with RazorpayX, pay salaries directly to your employees&apos; bank accounts.</>}
        />
<div className="space-y-4">
        <GlassCard>
          <CardContent>
            <PaymentAccountManager
              initial={account}
              actions={{ save: savePaymentAccountAction, test: testPaymentAccountAction, disconnect: disconnectPaymentAccountAction }}
            />
          </CardContent>
        </GlassCard>
      </div>
</div>
    </div>
  );
}
