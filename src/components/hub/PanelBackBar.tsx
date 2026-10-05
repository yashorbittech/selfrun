import BillingNotice from "@/components/platform/BillingNotice";
import PanelBackLink from "@/components/hub/PanelBackLink";
import SetupBanner from "@/components/workspace/SetupBanner";
import VerifyEmailBanner from "@/components/workspace/VerifyEmailBanner";
import { getCurrentHubUser } from "@/lib/hub-auth";
import { showVerifyStrip } from "@/lib/platform/email-verification-rule";
import { setupStripNeeded } from "@/lib/platform/onboarding/state";
import { isPlatformOwnerContext } from "@/lib/platform/tenancy/context";

/**
 * The top action row every panel shares: "Back to Workspace" on the left; Verify email, Choose plan (billing) and
 * Setup on the right. Panels open in the same tab from the Workspace, so this is the way home. The back link and the
 * Verify / Setup strips show only to people signed in to the Workspace (panels also serve people who never see it).
 */
export default async function PanelBackBar() {
  let user = null;
  let verify = false;
  let setup = { show: false, done: 0, total: 0 };
  try {
    user = await getCurrentHubUser();
    if (user) {
      const [own, s] = await Promise.all([
        isPlatformOwnerContext().catch(() => false),
        setupStripNeeded(user.roles).catch(() => ({ show: false, done: 0, total: 0 })),
      ]);
      verify = showVerifyStrip({ emailVerified: user.emailVerified !== false, isPlatformOwnerCompany: own });
      setup = s;
    }
  } catch {
    user = null;
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">{user && <PanelBackLink />}</div>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 empty:hidden">
        {user && verify && <VerifyEmailBanner email={user.email} />}
        <BillingNotice />
        {user && setup.show && <SetupBanner done={setup.done} total={setup.total} />}
      </div>
    </div>
  );
}
