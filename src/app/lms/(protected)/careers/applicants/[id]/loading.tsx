import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicantDetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-64" />
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard interactive={false} className="lg:col-span-2">
          <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full max-w-xs" />
            ))}
          </CardContent>
        </GlassCard>
        <GlassCard interactive={false}>
          <CardHeader><Skeleton className="h-4 w-16" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard interactive={false}>
        <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </GlassCard>
    </div>
  );
}
