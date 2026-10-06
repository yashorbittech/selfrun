import BrandSplashMark from "@/components/ui/BrandSplashMark";
import BrandSplashName from "@/components/ui/BrandSplashName";
import BrandBackdrop from "@/components/ui/BrandBackdrop";
import LoadingStatus from "@/components/ui/LoadingStatus";
import RunnerLoader from "@/components/ui/RunnerLoader";

const PAGE_STEPS = ["Fetching your data", "Putting the page together", "Polishing the details", "Nearly there"];

/**
 * Shown the instant a panel page is requested, inside the panel's shell (sidebar and top bar stay, so a click answers immediately): a
 * compact version of the opening screen — the company's mark, the cartoon runner and a moving status line — centred in the content
 * area. Theme tokens and the company's own brand only. Server component, no data access.
 */
export function PageLoading() {
  return (
    <div className="relative flex min-h-[55vh] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <BrandBackdrop />
      <BrandSplashMark size="md" />
      <RunnerLoader width="19rem" />
      <LoadingStatus steps={PAGE_STEPS} />
    </div>
  );
}

/**
 * Shown before a panel's shell exists (first load, the installed app opening): the company's own brand on a moving stage. Its logo (or
 * monogram) on a tilt-able glass tile with a ring and orbiting lights, its name, a cartoon runner hopping a crate, and a status line
 * that moves on. Everything — logo, name, colours — comes from the company of the host (the theme and `BrandProvider`); on a host with
 * no company it is neutral. Respects reduced motion. Server component, no data access.
 */
export function AppLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-hidden bg-background px-6" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <BrandBackdrop />
      <BrandSplashMark />
      <BrandSplashName className="app-rise text-center text-2xl font-black tracking-tight" />
      <div className="app-rise" style={{ animationDelay: "260ms" }}>
        <RunnerLoader />
      </div>
      <div className="app-rise" style={{ animationDelay: "380ms" }}>
        <LoadingStatus />
      </div>
    </div>
  );
}
