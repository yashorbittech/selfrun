"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { usePanelMeta } from "@/components/platform/PanelsProvider";

export default function PanelBackLink() {
  const segment = usePathname().split("/")[1] ?? "";
  const name = usePanelMeta(segment)?.name;
  return (
    <nav aria-label="Back to Workspace" className="flex shrink-0 items-center gap-3">
      <Link
        href="/workspace"
        className="group inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/80 py-1.5 pl-2 pr-4 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:bg-primary/8 hover:text-primary"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/12 text-primary transition-transform group-hover:-translate-x-0.5">
          <ArrowLeft className="size-3.5" />
        </span>
        Back to Workspace
      </Link>
      {name && (
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
          Workspace <ChevronRight className="size-3" /> <span className="font-medium text-foreground">{name}</span>
        </span>
      )}
    </nav>
  );
}
