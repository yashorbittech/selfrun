"use client";

import { createContext, useContext } from "react";
import type { PanelMeta } from "@/lib/platform/panels/types";

const PanelsContext = createContext<Record<string, PanelMeta>>({});

/** Provided once in the root layout with the Panel Registry as it applies to the current company. */
export function PanelsProvider({ panels, children }: { panels: Record<string, PanelMeta>; children: React.ReactNode }) {
  return <PanelsContext.Provider value={panels}>{children}</PanelsContext.Provider>;
}

export function usePanels(): Record<string, PanelMeta> {
  return useContext(PanelsContext);
}

export function usePanelMeta(key: string): PanelMeta | null {
  return useContext(PanelsContext)[key] ?? null;
}

/** The title + description every panel shows in its top bar — read from the Panel Registry, so one edit changes it everywhere. */
export function PanelHeading({ panel, fallbackTitle, fallbackDescription, className = "min-w-0" }: { panel: string; fallbackTitle?: string; fallbackDescription?: string; className?: string }) {
  const meta = usePanelMeta(panel);
  return (
    <div className={className}>
      <p className="truncate text-sm font-semibold text-foreground">{meta?.headerTitle ?? fallbackTitle ?? panel}</p>
      <p className="truncate text-[11px] text-muted-foreground">{meta?.headerDescription ?? fallbackDescription ?? ""}</p>
    </div>
  );
}

/** Just the panel's registry name, for headings and labels in server-rendered pages. */
export function PanelName({ panel, fallback }: { panel: string; fallback: string }) {
  return <>{usePanelMeta(panel)?.name ?? fallback}</>;
}

/** Older module keys some logs and records still carry, mapped to their Panel Registry key. */
const KEY_ALIASES: Record<string, string> = { teamchat: "messenger", admin: "workspace" };

/**
 * A function that turns a panel / module key into its registry name, falling back to the label the caller already has.
 * For client screens that list a module column or filter (documents, activity log, SOP links …).
 */
export function usePanelLabel(): (key: string, fallback?: string) => string {
  const panels = useContext(PanelsContext);
  return (key, fallback) => panels[KEY_ALIASES[key] ?? key]?.name ?? fallback ?? key;
}
