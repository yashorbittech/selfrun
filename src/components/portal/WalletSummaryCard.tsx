import Link from "next/link";
import { Coins } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { formatCredits } from "@/lib/wallet/constants";
import { BrandName } from "@/components/platform/BrandProvider";

/** Props-driven only — never imports a server-only wallet module. */
export default function WalletSummaryCard({
  available,
  earnedThisMonth,
  expiringSoon,
  frozen,
}: {
  available: number;
  earnedThisMonth: number;
  expiringSoon: number;
  frozen?: boolean;
}) {
  return (
    <GlassCard interactive={false}>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Coins className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground"><BrandName /> Wallet</p>
            <p className="text-2xl font-black tracking-tight text-foreground">{formatCredits(available)}</p>
            <p className="text-xs text-muted-foreground">
              {earnedThisMonth > 0 && <>+{earnedThisMonth.toLocaleString("en-IN")} this month</>}
              {earnedThisMonth > 0 && expiringSoon > 0 && " · "}
              {expiringSoon > 0 && <>{expiringSoon.toLocaleString("en-IN")} expiring within 30 days</>}
              {frozen && " · wallet frozen"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/portal/wallet" className="rounded-full bg-primary px-4 py-1.5 font-semibold text-primary-foreground">
            View Wallet
          </Link>
          <Link href="/portal/referrals" className="rounded-full border border-border px-4 py-1.5 font-medium text-foreground hover:border-primary">
            Earn Credits
          </Link>
        </div>
      </CardContent>
    </GlassCard>
  );
}
