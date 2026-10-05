import { CardContent, CardHeader } from "@/components/ui/card";
import GlassCard from "@/components/lms/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatbotConfigLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-64" />
      <div>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassCard interactive={false} key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-8 w-full max-w-sm" />
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}
