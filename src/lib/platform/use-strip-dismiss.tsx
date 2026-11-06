"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Hook to manage 24-hour dismiss state for workspace action strips / banners.
 * When cancelled, the strip stays hidden for 24 hours, and automatically
 * reappears once the 24 hours elapse.
 */
export function useStripDismiss(stripId: string, label?: string, durationMs = TWENTY_FOUR_HOURS_MS) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const key = `workspace_strip_dismiss:${stripId}`;
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const dismissedAt = Number(stored);
        if (!isNaN(dismissedAt)) {
          const elapsed = Date.now() - dismissedAt;
          if (elapsed >= 0 && elapsed < durationMs) {
            setIsDismissed(true);
            return;
          }
          // Expired after 24 hours — clear storage so it displays again
          window.localStorage.removeItem(key);
        }
      }
    } catch {}
    setIsDismissed(false);
  }, [stripId, durationMs]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      const key = `workspace_strip_dismiss:${stripId}`;
      window.localStorage.setItem(key, String(Date.now()));
    } catch {}

    const stripName = label || "Notice";
    toast.info(`${stripName} dismissed for 24 hours`, {
      description: "It will automatically reappear after 24 hours.",
      action: {
        label: "Undo",
        onClick: () => {
          try {
            window.localStorage.removeItem(`workspace_strip_dismiss:${stripId}`);
          } catch {}
          setIsDismissed(false);
        },
      },
    });
  }, [stripId, label]);

  return { isDismissed: mounted && isDismissed, dismiss, mounted };
}

/**
 * Standard compact cancel/close button for strip pills.
 */
export function StripDismissButton({ onDismiss, label }: { onDismiss: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }}
      title={`Dismiss ${label ? `"${label}" ` : ""}for 24 hours`}
      aria-label={`Dismiss ${label ? `"${label}" ` : ""}for 24 hours`}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-all hover:bg-foreground/10 hover:text-foreground dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <X className="size-3" />
    </button>
  );
}
