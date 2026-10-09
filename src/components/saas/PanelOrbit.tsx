"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Icon from "@/components/saas/Icon";
import type { IconKey } from "@/lib/saas/content";

export interface OrbitPanel {
  key: string;
  name: string;
  description: string;
  icon: IconKey;
  color: string;
}

/** Every module as a circle on two rotating rings around the platform. Hover, focus or tap a circle to read what it is; it pauses while you do. */
export default function PanelOrbit({ panels, brand }: { panels: OrbitPanel[]; brand: string }) {
  const [active, setActive] = useState<OrbitPanel | null>(null);
  const innerCount = Math.min(7, Math.ceil(panels.length / 3));
  const inner = panels.slice(0, innerCount);
  const outer = panels.slice(innerCount);

  const ring = (list: OrbitPanel[], radius: number, size: string, rev: boolean) => (
    <div className={`absolute inset-0 ${rev ? "sr-orbit-spin-rev" : "sr-orbit-spin"} sr-orbit-spin`}>
      {list.map((p, i) => {
        const a = (i / list.length) * Math.PI * 2 - Math.PI / 2;
        const on = active?.key === p.key;
        return (
          <button
            key={p.key}
            type="button"
            aria-label={p.name}
            aria-pressed={on}
            onMouseEnter={() => setActive(p)}
            onFocus={() => setActive(p)}
            onClick={() => setActive(p)}
            className="absolute -translate-x-1/2 -translate-y-1/2 outline-offset-4"
            style={{ left: `${50 + radius * 100 * Math.cos(a)}%`, top: `${50 + radius * 100 * Math.sin(a)}%`, width: size }}
          >
            <span className={`${rev ? "sr-orbit-node-rev" : "sr-orbit-node"} block`}>
              <span
                className={`sr-circle aspect-square w-full shadow-lg shadow-primary/25 ring-4 transition-transform duration-300 ${on ? "scale-[1.18] ring-primary/25" : "ring-background"}`}
              >
                <Icon name={p.icon} className="size-[46%]" />
              </span>
              <span className="mt-1.5 hidden max-w-[96px] -translate-x-0 truncate text-center text-[11px] font-semibold md:block" style={{ color: on ? "var(--primary)" : "var(--foreground)" }}>{p.name.replace(/ (Management|System)$/i, "").replace("Client & Student Portal", "Client Portal").replace("Procurement & Assets", "Procurement")}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="sr-orbit relative mx-auto aspect-square w-full max-w-[680px]">
      <div className="sr-orbit-ring" style={{ inset: "4%" }} aria-hidden />
      <div className="sr-orbit-ring" style={{ inset: "20%" }} aria-hidden />
      <div className="absolute rounded-full" style={{ inset: "30%", background: "radial-gradient(circle, color-mix(in oklch, var(--primary) 14%, transparent), transparent 70%)" }} aria-hidden />
      {ring(outer, 0.45, "min(11.5%, 76px)", false)}
      {ring(inner, 0.3, "min(12.5%, 82px)", true)}
      <div className="absolute inset-[35%] flex flex-col items-center justify-center rounded-full bg-white p-3 text-center" style={{ boxShadow: "0 20px 50px -18px color-mix(in oklch, var(--primary) 45%, transparent)", border: "1px solid var(--border)" }} aria-live="polite">
        {active ? (
          <>
            <span className="sr-circle size-9 sm:size-11"><Icon name={active.icon} /></span>
            <p className="sr-display mt-1.5 text-[12px] leading-tight font-semibold sm:text-[15px]">{active.name}</p>
            <p className="sr-muted mt-1 line-clamp-3 hidden text-[11.5px] leading-snug sm:block">{active.description}</p>
            <Link href={`/features/${active.key}`} className="sr-link mt-1.5 text-[12px]">Explore <ArrowRight className="size-3" /></Link>
          </>
        ) : (
          <>
            <p className="sr-display text-[13px] font-semibold sm:text-lg">{brand}</p>
            <p className="sr-muted mt-0.5 text-[11px] sm:text-[13px]">{panels.length} panels · one login</p>
          </>
        )}
      </div>
    </div>
  );
}
