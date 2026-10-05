"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Globe, Loader2, LogIn, PanelsTopLeft, Building2, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Milliseconds after submit at which this step becomes the active one. */
  at: number;
}

/**
 * Shown in place of the sign-up form while the workspace is being created. The server does the work in one go and
 * redirects when it's done, so the steps are paced by time (they describe what the server is doing, in order) and the
 * bar eases toward — but never reaches — 100% until the page changes.
 */
export default function CreatingWorkspace({ companyName, host, approval = false }: { companyName: string; host: string; approval?: boolean }) {
  const reduce = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started), 120);
    return () => clearInterval(t);
  }, []);

  const steps: Step[] = approval
    ? [
        { title: "Checking your details", detail: "Making sure the address is free", icon: ShieldCheck, at: 0 },
        { title: "Sending your request", detail: "Our team will review it", icon: Send, at: 1500 },
      ]
    : [
        { title: "Creating your company", detail: companyName ? `Setting up ${companyName}` : "Setting up your company record", icon: Building2, at: 0 },
        { title: "Reserving your address", detail: host, icon: Globe, at: 1400 },
        { title: "Preparing your workspace", detail: "Roles, panels and your free trial", icon: PanelsTopLeft, at: 3200 },
        { title: "Building your website", detail: "A starter site, ready to edit", icon: Check, at: 5600 },
        { title: "Signing you in", detail: "Opening your workspace", icon: LogIn, at: 8200 },
      ];

  const active = steps.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);
  const percent = Math.min(96, Math.round(96 * (1 - Math.exp(-elapsed / 5200))));
  const initial = (companyName.trim()[0] ?? "W").toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="w-full max-w-md" data-testid="creating-workspace">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-7 shadow-xl shadow-primary/5 backdrop-blur sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/25 to-transparent blur-3xl" />

        <div className="relative mx-auto mb-5 flex size-24 items-center justify-center">
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ background: "conic-gradient(from 0deg, var(--primary), transparent 65%, var(--secondary))", mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
          />
          <span aria-hidden className="absolute inset-3 rounded-full bg-primary/10" />
          <motion.span
            className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-black text-primary-foreground shadow-lg shadow-primary/30"
            animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {initial}
          </motion.span>
        </div>

        <div className="relative text-center">
          <h2 className="text-xl font-black tracking-tight">{approval ? "Sending your request" : "Creating your workspace"}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{approval ? companyName : host}</p>
        </div>

        <div className="relative mt-6">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{steps[active]?.title}</span>
            <span className="tabular-nums text-muted-foreground">{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Creating your workspace" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <motion.div className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-primary to-secondary" initial={false} animate={{ width: `${percent}%` }} transition={{ duration: 0.4, ease: "easeOut" }}>
              {!reduce && <motion.span aria-hidden className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent" animate={{ x: ["-100%", "400%"] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />}
            </motion.div>
          </div>
        </div>

        <ol className="relative mt-6 space-y-1" aria-label="Progress">
          {steps.map((s, i) => {
            const state = i < active ? "done" : i === active ? "active" : "todo";
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative flex items-start gap-3 rounded-xl px-2 py-2" aria-current={state === "active" ? "step" : undefined}>
                {i < steps.length - 1 && <span aria-hidden className={cn("absolute top-9 bottom-[-0.5rem] left-[1.4rem] w-px", state === "done" ? "bg-primary/50" : "bg-border")} />}
                <span
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs transition-all duration-300",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "active" && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                    state === "todo" && "border-border bg-muted/60 text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="size-4" /> : state === "active" ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                </span>
                <span className={cn("min-w-0 pt-0.5 transition-opacity duration-300", state === "todo" && "opacity-50")}>
                  <span className="block text-sm font-semibold leading-tight">{s.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.detail}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="relative mt-5 text-center text-xs text-muted-foreground" role="status" aria-live="polite">
          {steps[active]?.title}… This usually takes a few seconds — please keep this tab open.
        </p>
      </div>
    </motion.div>
  );
}
