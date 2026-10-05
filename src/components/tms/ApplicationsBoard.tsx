"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GraduationCap, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/tms/constants";
import { setApplicationStatusAction } from "@/app/tms/(protected)/(staff)/applications/actions";
import type { SerializedApplication } from "@/lib/tms/applications";

export type BoardCard = SerializedApplication & { programName: string };
type Columns = Record<ApplicationStatus, BoardCard[]>;

function Card({ card, dragHandle }: { card: BoardCard; dragHandle?: React.HTMLAttributes<HTMLButtonElement> }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3 shadow-none">
      <div className="flex items-start gap-2">
        {dragHandle && (
          <button type="button" className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing" {...dragHandle} aria-label="Drag">
            <GripVertical className="size-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/tms/applications/${card._id}`} className="block truncate text-sm font-medium hover:underline">
            {card.fullName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{card.programName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-mono">{card.applicationCode}</span>
            <span>·</span>
            <span>{formatDate(card.createdAt)}</span>
          </p>
          {card.studentId && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-green-500/15 px-1.5 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
              <GraduationCap className="size-3" /> Converted
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableCard({ card, disabled }: { card: BoardCard; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card._id, disabled });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}>
      <Card card={card} dragHandle={disabled ? undefined : { ...attributes, ...listeners }} />
    </div>
  );
}

function Column({ status, label, dotClass, cards }: { status: ApplicationStatus; label: string; dotClass: string; cards: BoardCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-border/50 bg-muted/30 p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className={`size-2 rounded-full ${dotClass}`} />
          {label}
          <span className="text-xs font-normal text-muted-foreground">{cards.length}</span>
        </span>
      </div>
      <div ref={setNodeRef} className={cn("flex min-h-24 flex-1 flex-col gap-2 rounded-xl p-1 transition-colors", isOver && "bg-primary/5")}>
        <SortableContext items={cards.map((c) => c._id)} strategy={verticalListSortingStrategy}>
          {cards.map((c) => (
            <SortableCard key={c._id} card={c} disabled={status === "enrolled"} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            {status === "enrolled" ? "Convert applicants to enrol" : "Drop here"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsBoard({ board }: { board: Columns }) {
  const router = useRouter();
  const [columns, setColumns] = useState<Columns>(board);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const allCards = useMemo(() => Object.values(columns).flat(), [columns]);
  const activeCard = activeId ? allCards.find((c) => c._id === activeId) ?? null : null;

  function columnOf(id: string): ApplicationStatus | null {
    for (const s of APPLICATION_STATUSES) if (columns[s.value].some((c) => c._id === id)) return s.value;
    return null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const from = columnOf(activeIdStr);
    if (!from) return;
    const to: ApplicationStatus | null = overIdStr.startsWith("col:")
      ? (overIdStr.slice(4) as ApplicationStatus)
      : columnOf(overIdStr);
    if (!to || to === from) return;
    if (to === "enrolled" || from === "enrolled") {
      toast.error("Use “Convert to Student” to enrol an applicant.");
      return;
    }

    const snapshot = columns;
    const moving = snapshot[from].find((c) => c._id === activeIdStr);
    if (!moving) return;
    const next: Columns = {
      ...snapshot,
      [from]: snapshot[from].filter((c) => c._id !== activeIdStr),
      [to]: [{ ...moving, status: to }, ...snapshot[to]],
    };
    setColumns(next);

    const result = await setApplicationStatusAction(activeIdStr, to);
    if (!result.ok) {
      setColumns(snapshot);
      toast.error(result.error ?? "Could not move application.");
      return;
    }
    router.refresh();
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {APPLICATION_STATUSES.map((s) => (
          <Column key={s.value} status={s.value} label={s.label} dotClass={s.dotClass} cards={columns[s.value]} />
        ))}
      </div>
      <DragOverlay>{activeCard ? <Card card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
