import type { Metadata } from "next";
import BrandBackdrop from "@/components/ui/BrandBackdrop";
import BrandSplashMark from "@/components/ui/BrandSplashMark";
import BrandSplashName from "@/components/ui/BrandSplashName";
import RunnerLoader from "@/components/ui/RunnerLoader";
import MaintenanceCountdown from "@/components/platform/MaintenanceCountdown";
import { getEffectiveMaintenance } from "@/lib/platform/maintenance-state";
import { currentCompanyIdOrNull } from "@/lib/platform/tenancy/context";

/**
 * What every company's website and panels show during a platform maintenance window in "takeover" mode (the proxy rewrites page views to
 * it, answering 503 so search engines retry). The company's own logo, name and colours, an animated scene, the platform's message and a
 * live countdown; when the window ends the proxy simply stops rewriting and the countdown reloads into the real site.
 */
export const metadata: Metadata = { title: "Back soon", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PlatformMaintenancePage() {
  const m = await getEffectiveMaintenance(await currentCompanyIdOrNull());
  const message = m.message || "We’re making things better and will be back shortly. Thanks for your patience.";
  return (
    <main className="fixed inset-0 z-[9999] isolate flex overflow-y-auto bg-background px-5 py-10">
      <BrandBackdrop />
      <div className="m-auto flex w-full max-w-xl flex-col items-center gap-3 text-center">
        <BrandSplashMark size="md" />
        <BrandSplashName className="app-rise text-xl font-black tracking-tight" />
        <div className="app-rise mt-8" style={{ animationDelay: "200ms" }}>
          <RunnerLoader scene="lost" sign="BACK SOON" width="20rem" />
        </div>
        <div className="app-rise w-full rounded-3xl border border-border/70 bg-card/80 p-7 shadow-xl shadow-primary/5 backdrop-blur sm:p-9" style={{ animationDelay: "320ms" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Scheduled maintenance</p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">We’ll be right back</h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">{message}</p>
          <div className="mt-7 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Back in</p>
            <MaintenanceCountdown endsAt={m.endsAt} />
          </div>
        </div>
      </div>
    </main>
  );
}
