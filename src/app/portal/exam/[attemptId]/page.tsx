import { notFound, redirect } from "next/navigation";
import ExamRunner from "@/components/ots/ExamRunner";
import { getCurrentPortalUser } from "@/lib/portal-auth";
import { TEST_TAKER_ROLES } from "@/lib/portal-roles";
import { resolveTaker } from "@/lib/ots/taker";
import { AttemptClosedError, loadExamState } from "@/lib/ots/attempts";
import { Toaster } from "@/components/ui/sonner";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const generateMetadata = () => brandedMetadata("Test in progress · {brand} {panel:portal}", { robots: { index: false, follow: false } });
export const dynamic = "force-dynamic";

/** Distraction-free exam page for applicants / students — the same ExamRunner as the OTS panel. */
export default async function PortalExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentPortalUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/portal/change-password");
  if (!TEST_TAKER_ROLES.includes(user.role)) redirect("/portal");
  const taker = await resolveTaker("portal");
  if (!taker) redirect("/portal");
  const { attemptId } = await params;
  let state;
  try {
    state = await loadExamState(taker, attemptId);
  } catch (err) {
    if (err instanceof AttemptClosedError) redirect(`/portal/tests/results/${attemptId}`);
    notFound();
  }
  return (
    <>
      <ExamRunner channel="portal" initial={state} resultsBase="/portal/tests/results" testsBase="/portal/tests" />
      <Toaster position="top-center" richColors />
    </>
  );
}
