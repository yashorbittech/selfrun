import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeBaseLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-72" />
      <div>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard interactive={false} key={i}>
            <CardContent className="py-4">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </GlassCard>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <GlassCard interactive={false} key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}
