import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function VoiceConversationDetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-80" />
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <GlassCard interactive={false} className="h-fit">
          <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </GlassCard>
        <GlassCard interactive={false}>
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
