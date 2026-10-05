import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "info", label: "Basic Information" },
  { key: "config", label: "Configure" },
  { key: "sections", label: "Sections & Questions" },
  { key: "preview", label: "Preview" },
  { key: "publish", label: "Publish" },
] as const;

/** Create Test → Basic Information → Configure → Sections → Questions & Marks → Preview → Publish. */
export default function TestStepper({ testId, current, published }: { testId: string | null; current: (typeof STEPS)[number]["key"]; published?: boolean }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  const href = (k: string) => (testId ? (k === "preview" ? `/ots/tests/${testId}/preview` : k === "publish" ? `/ots/tests/${testId}` : `/ots/tests/${testId}/edit?step=${k}`) : null);
  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-xs">
      {STEPS.map((s, i) => {
        const done = i < idx || (s.key === "publish" && published);
        const h = href(s.key);
        const body = (
          <span className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1", i === idx ? "border-primary bg-primary/10 font-semibold text-primary" : done ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400" : "border-border/60 text-muted-foreground")}>
            <span className={cn("flex size-4 items-center justify-center rounded-full text-[10px]", i === idx ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted")}>{done ? <Check className="size-2.5" /> : i + 1}</span>
            {s.label}
          </span>
        );
        return (
          <li key={s.key} className="flex items-center gap-1.5">
            {h && i !== idx ? <Link href={h}>{body}</Link> : body}
            {i < STEPS.length - 1 && <span className="text-muted-foreground">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
