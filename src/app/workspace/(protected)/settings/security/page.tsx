import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { requireWorkspaceAccess } from "@/lib/workspace/access";
import { getCompanySecurity } from "@/lib/workspace/company";
import { formatDateTime } from "@/lib/utils";
import SignOutEverywhere from "./SignOutEverywhere";

export const metadata: Metadata = { title: "Security", robots: { index: false, follow: false } };

const linkClass = "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary";

/** Sign-in security from the data that exists: last sign-in, password, sessions, accounts needing attention. */
export default async function SecurityPage() {
  const user = await requireWorkspaceAccess("company.security");
  const s = await getCompanySecurity(user.id);

  return (
    <div className="min-h-screen bg-muted/70 px-4 py-10 dark:bg-background">
      <div className="space-y-4">
<PanelPageHeader
          breadcrumbs={[{ label: "Company settings", href: "/workspace/settings" }, { label: "Security" }]}
          title={<>Security</>}
        />
<div className="space-y-4">

        <GlassCard interactive={false}>
          <CardHeader>
            <CardTitle className="text-base">Your sign-in</CardTitle>
            <CardDescription>Signed in as {user.email}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p id="security-last-signin">{user.lastLoginAt ? `Last sign-in: ${formatDateTime(user.lastLoginAt.toISOString())}` : "This is your first sign-in."}</p>
            <p id="security-sessions" data-count={s.ownSessions}>
              {s.ownSessions === 1 ? "You have 1 open Workspace session (this one)." : `You have ${s.ownSessions} open Workspace sessions, including this one.`} Sessions end by themselves after 7 days.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/workspace/change-password" className={linkClass}>
                Change password <ArrowRight className="size-3.5" />
              </Link>
              <SignOutEverywhere />
            </div>
            <p className="text-xs text-muted-foreground">Signing out everywhere ends your sessions in every panel, on every device, including this one.</p>
          </CardContent>
        </GlassCard>

        <GlassCard interactive={false}>
          <CardHeader>
            <CardTitle className="text-base">Your company&apos;s accounts</CardTitle>
            <CardDescription>Accounts lock for 15 minutes after 5 failed sign-ins. Passwords are at least 10 characters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl id="security-accounts" className="grid gap-3 sm:grid-cols-4">
              {[
                ["Active accounts", s.accounts],
                ["Super Admins", s.superAdmins],
                ["Must change password", s.mustChangePassword],
                ["Locked right now", s.locked],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/60 p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Link href="/workspace/users" className={linkClass}>
                Manage users and reset passwords <ArrowRight className="size-3.5" />
              </Link>
              <Link href="/workspace/settings/audit-log" className={linkClass}>
                Audit log <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </CardContent>
        </GlassCard>
      </div>
</div>
    </div>
  );
}
