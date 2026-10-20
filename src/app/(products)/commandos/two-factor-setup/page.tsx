import { redirect } from "next/navigation";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { PanelName } from "@/components/platform/PanelsProvider";
import { BrandName } from "@/components/platform/BrandProvider";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { mustSetUpTwoFactor, twoFactorStatus } from "@/lib/security/two-factor";
import { ObjectId } from "mongodb";
import TwoFactorCard from "../(protected)/settings/security/TwoFactorCard";

export const dynamic = "force-dynamic";

/**
 * Privileged accounts (Super Admins and Platform Console users) must turn on two-step sign-in before they can use the workspace. This page
 * is outside the protected area on purpose, so the person can finish setting it up; every protected page sends them here until they have.
 */
export default async function TwoFactorSetupPage() {
  const user = await getCurrentHubUser();
  if (!user || !ObjectId.isValid(user.id)) redirect("/commandos/login");
  const tf = await twoFactorStatus(new ObjectId(user.id));
  const stillRequired = await mustSetUpTwoFactor(user, { alwaysPrivileged: false });

  return (
    <div className="lms-shell flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 py-12">
      <div className="flex items-center gap-2 text-lg font-bold">
        <BrandMark className="size-7 shrink-0" />
        <BrandName /> <span className="text-foreground"><PanelName panel="workspace" fallback="Workspace" /></span>
      </div>
      <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Turn on two-step sign-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account can change settings, people and billing for the whole company, so it needs a second check. Scan the code with an authenticator app, enter the first
            six-digit code, and keep your recovery codes.
          </p>
        </div>
        <TwoFactorCard status={{ enabled: tf.enabled, enabledAt: tf.enabledAt ? tf.enabledAt.toISOString() : null, recoveryLeft: tf.recoveryLeft, available: tf.available }} />
        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <Link href="/commandos" className="font-medium text-primary hover:underline">{stillRequired ? "I've turned it on: continue" : "Continue"}</Link>
          <Link href="/commandos/login" className="text-muted-foreground hover:underline">Sign out</Link>
        </div>
      </div>
    </div>
  );
}
