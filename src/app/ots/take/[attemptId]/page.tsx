import { notFound, redirect } from "next/navigation";
import ExamRunner from "@/components/ots/ExamRunner";
import { getCurrentOtsUser } from "@/lib/ots-auth";
import { resolveTaker } from "@/lib/ots/taker";
import { AttemptClosedError, loadExamState } from "@/lib/ots/attempts";
import { Toaster } from "@/components/ui/sonner";
import { brandedMetadata } from "@/lib/platform/branding/metadata";

export const generateMetadata = () => brandedMetadata("Test in progress · {brand}", { robots: { index: false, follow: false } });
export const dynamic = "force-dynamic";

/** Distraction-free exam page (outside the panel shell): no sidebar, no navigation away. */
export default async function TakeTestPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentOtsUser();
  if (!user) redirect("/ots/login");
  if (user.mustChangePassword) redirect("/ots/change-password");
  const taker = await resolveTaker("staff");
  if (!taker) redirect("/ots");
  const { attemptId } = await params;
  let state;
  try {
    state = await loadExamState(taker, attemptId);
  } catch (err) {
    if (err instanceof AttemptClosedError) redirect(`/ots/my-results/${attemptId}`);
    notFound();
  }
  return (
    <>
      <ExamRunner channel="staff" initial={state} resultsBase="/ots/my-results" testsBase="/ots/my-tests" />
      <Toaster position="top-center" richColors />
    </>
  );
}
