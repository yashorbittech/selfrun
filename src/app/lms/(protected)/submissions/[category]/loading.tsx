import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubmissionsListLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-56" />
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>

      <GlassCard interactive={false}>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-40" />
            ))}
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard interactive={false}>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
