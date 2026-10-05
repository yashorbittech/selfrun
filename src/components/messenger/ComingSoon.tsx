import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/lms/Breadcrumbs";

export default function ComingSoon({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
<PanelPageHeader breadcrumbs={[{ label: "Messenger", href: "/messenger" }, { label: title }]} title={<>{title}</>} description={<>{description}</>} />
<div className="mx-auto max-w-xl">
        <div className="mt-6 rounded-3xl border border-border/50 bg-card p-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-accent text-white">
            <Rocket className="size-5" />
          </div>
          <p className="text-base font-semibold text-foreground">Coming soon</p>
          <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                {b}
              </li>
            ))}
          </ul>
          <Button render={<Link href="/messenger" />} variant="outline" size="sm" className="mt-6">
            Back to dashboard
          </Button>
        </div>
      </div>
</div>
    </div>
  );
}
