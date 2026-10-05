import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function VoiceDashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-56" />
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <GlassCard interactive={false}>
        <CardContent>
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </GlassCard>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCard interactive={false} key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-12" />
            </CardContent>
          </GlassCard>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard interactive={false} key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}
