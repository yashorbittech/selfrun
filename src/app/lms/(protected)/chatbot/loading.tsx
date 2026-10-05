import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatbotDashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-40" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>

      <GlassCard interactive={false}>
        <CardContent>
          <Skeleton className="h-8 w-40" />
        </CardContent>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
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

      {Array.from({ length: 2 }).map((_, i) => (
        <GlassCard interactive={false} key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}
