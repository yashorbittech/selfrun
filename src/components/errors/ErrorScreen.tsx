import type { ReactNode } from "react";

/**
 * Full-page (viewport-covering) shell for the "nothing here" screens (404, no workspace): a soft brand glow and grid, a big faint code behind
 * a card with the message and its actions. Server component, no data access, and it only uses theme tokens, so it takes the
 * colours of whichever site or product it is shown on.
 */
export default function ErrorScreen({
  code,
  icon,
  title,
  children,
  actions,
  footer,
}: {
  code: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    // Fixed over the whole viewport: a 404 raised inside a site layout must not show that layout's header, footer or floating buttons.
    <main className="fixed inset-0 z-[9999] isolate flex overflow-y-auto bg-background px-5 py-16">
      {/* glow + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(60% 45% at 50% 0%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%), linear-gradient(to right, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 44px 44px, 44px 44px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 35%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 35%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[12%] -z-10 -translate-x-1/2 select-none text-[clamp(9rem,28vw,20rem)] font-black leading-none tracking-tighter text-foreground/[0.04]"
      >
        {code}
      </div>

      <div className="m-auto w-full max-w-lg">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-xl shadow-primary/5 backdrop-blur sm:p-10">
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">{icon}</div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{code}</p>
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <div className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">{children}</div>
          {actions ? <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div> : null}
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  );
}
