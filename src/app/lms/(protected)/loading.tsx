import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <GlassCard interactive={false} key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-3 w-16" /></CardHeader>
            <CardContent><Skeleton className="h-7 w-12" /></CardContent>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard interactive={false}>
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </GlassCard>
        <GlassCard interactive={false}>
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </GlassCard>
      </div>

      <GlassCard interactive={false}>
        <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
