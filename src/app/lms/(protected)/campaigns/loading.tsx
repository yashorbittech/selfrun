import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      <GlassCard interactive={false}>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-40" />
            ))}
          </div>
        </CardContent>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <GlassCard interactive={false} key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-3 w-16" /></CardHeader>
            <CardContent><Skeleton className="h-6 w-20" /></CardContent>
          </GlassCard>
        ))}
      </div>

      <GlassCard interactive={false}>
        <CardHeader><Skeleton className="h-4 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <GlassCard interactive={false} key={i}>
            <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-56 w-full" /></CardContent>
          </GlassCard>
        ))}
      </div>

      <GlassCard interactive={false}>
        <CardHeader><Skeleton className="h-4 w-44" /></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
