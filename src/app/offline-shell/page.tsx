import type { Metadata } from "next";
import BrandBackdrop from "@/components/ui/BrandBackdrop";
import BrandSplashMark from "@/components/ui/BrandSplashMark";
import BrandSplashName from "@/components/ui/BrandSplashName";
import RunnerLoader from "@/components/ui/RunnerLoader";
import { buttonVariants } from "@/components/ui/button";

/**
 * What the installed app shows when there is no connection. The service worker (public/sw.js) keeps a copy of this page and of its
 * stylesheet and logo, per site (so each company's app has its own), and serves it when a navigation fails. It is rendered by the
 * company's own layout, so the logo, name, colours and fonts are the company's. The retry works without any script bundle: a tiny
 * inline script reloads on the button and as soon as the browser reports it is back online.
 */
export const metadata: Metadata = { title: "You’re offline", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const RETRY = `(function(){var b=document.getElementById('offline-retry'),s=document.getElementById('offline-status');function go(){if(s)s.textContent='Reconnecting…';location.reload();}if(b)b.addEventListener('click',go);addEventListener('online',go);})();`;

export default function OfflinePage() {
  return (
    <main className="fixed inset-0 z-[9999] isolate flex overflow-y-auto bg-background px-5 py-10">
      <BrandBackdrop />
      <div className="m-auto flex w-full max-w-lg flex-col items-center gap-3">
        <BrandSplashMark size="md" />
        <BrandSplashName className="app-rise text-center text-xl font-black tracking-tight" />
        <div className="app-rise mt-9 sm:mt-10" style={{ animationDelay: "200ms" }}>
          <RunnerLoader scene="lost" sign="OFFLINE" width="20rem" />
        </div>
        <div className="app-rise w-full rounded-3xl border border-border/70 bg-card/80 p-7 text-center shadow-xl shadow-primary/5 backdrop-blur sm:p-9" style={{ animationDelay: "320ms" }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">No connection</p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">You’re offline</h1>
          <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
            This app needs an internet connection. Check your connection and try again. Nothing you entered has been lost on the server.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <button id="offline-retry" type="button" className={buttonVariants({ size: "lg" })}>
              Try again
            </button>
            <p id="offline-status" className="text-xs text-muted-foreground" aria-live="polite">We’ll reconnect automatically when you’re back online.</p>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: RETRY }} />
    </main>
  );
}
