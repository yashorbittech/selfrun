import { CardContent } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function VoiceConversationsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-72" />
      <div>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <GlassCard interactive={false}>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-36" />
            ))}
          </div>
        </CardContent>
      </GlassCard>
      <GlassCard interactive={false}>
        <CardContent className="space-y-2 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </GlassCard>
    </div>
  );
}
