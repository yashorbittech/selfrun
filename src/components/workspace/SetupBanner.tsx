"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

/**
 * The "Complete setup" strip: shown to a company owner on every Workspace page
 * (the dashboard included) until setup is completed, whether or not it was
 * skipped. Not on the wizard itself.
 */
export default function SetupBanner({ done, total }: { done: number; total: number }) {
  const path = usePathname();
  if (path.startsWith("/workspace/onboarding")) return null;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div
      id="setup-banner"
      role="status"
      title="Company profile, departments, team invites, branding and panels"
      className="inline-flex max-w-full shrink-0 items-center gap-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 dark:border-border dark:bg-card py-1 pl-3 pr-1 text-xs backdrop-blur-md"
    >
      <span className="font-semibold text-foreground">Finish setup</span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-amber-500/25" aria-hidden>
          <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
        </span>
        {done}/{total}
      </span>
      <Link href="/workspace/onboarding" id="setup-banner-link" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-bold text-primary-foreground transition-colors hover:bg-primary/90">
        Complete <ArrowUpRight className="size-3" />
      </Link>
    </div>
  );
}
