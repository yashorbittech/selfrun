import { Skeleton } from "@/components/ui/skeleton";
import GlassCard from "@/components/lms/GlassCard";

/** Shown while a CMS screen loads — mirrors the header + toolbar + list layout every screen uses. */
export default function CmsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-80 max-w-[60vw]" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-72 rounded-full" />
        <Skeleton className="h-9 w-56 rounded-full" />
      </div>
      <GlassCard interactive={false} className="gap-0 overflow-hidden p-0 py-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5 last:border-0">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
