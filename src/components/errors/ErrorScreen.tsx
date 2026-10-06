import type { ReactNode } from "react";
import BrandSplashMark from "@/components/ui/BrandSplashMark";
import BrandSplashName from "@/components/ui/BrandSplashName";
import BrandBackdrop from "@/components/ui/BrandBackdrop";
import RunnerLoader from "@/components/ui/RunnerLoader";

/**
 * Full-page (viewport-covering) shell for the "nothing here" screens (404, no workspace): the same moving stage as the loading
 * screen. The company's own logo and name (nothing at all on a host no company owns), a cartoon runner who has lost its way beside
 * a leaning signpost, then a card with the message and its actions. Server component, no data access; only theme tokens, so it takes
 * the colours of whichever site or company it is shown on.
 */
export default function ErrorScreen({
  code,
  title,
  children,
  actions,
  footer,
}: {
  code: string;
  /** Kept for callers; the stage replaces the icon tile. */
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    // Fixed over the whole viewport: a 404 raised inside a site layout must not show that layout's header, footer or floating buttons.
    <main className="fixed inset-0 z-[9999] isolate flex overflow-y-auto bg-background px-5 py-10">
      <BrandBackdrop />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[8%] -z-10 -translate-x-1/2 select-none text-[clamp(9rem,28vw,20rem)] font-black leading-none tracking-tighter text-foreground/[0.03]">
        {code}
      </div>

      <div className="m-auto flex w-full max-w-lg flex-col items-center gap-3">
        <BrandSplashMark size="md" />
        <BrandSplashName className="app-rise text-center text-xl font-black tracking-tight" />
        <div className="app-rise mt-9 sm:mt-10" style={{ animationDelay: "200ms" }}>
          <RunnerLoader scene="lost" sign={code} width="20rem" />
        </div>

        <div className="app-rise w-full rounded-3xl border border-border/70 bg-card/80 p-7 text-center shadow-xl shadow-primary/5 backdrop-blur sm:p-9" style={{ animationDelay: "320ms" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{code}</p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <div className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">{children}</div>
          {actions ? <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div> : null}
        </div>
        {footer ? <div className="app-rise mt-2 text-center text-sm text-muted-foreground" style={{ animationDelay: "420ms" }}>{footer}</div> : null}
      </div>
    </main>
  );
}
