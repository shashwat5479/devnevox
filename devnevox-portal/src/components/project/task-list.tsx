"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Circle, CircleDot, Ban } from "lucide-react";
import type { Task, TaskStatus } from "@prisma/client";
import { setTaskStatus } from "@/server/actions/tasks";
import { cn } from "@/lib/utils";

const cycle: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO", BLOCKED: "TODO",
};
const icon: Record<TaskStatus, React.ReactNode> = {
  TODO: <Circle className="size-4 text-muted-foreground" />,
  IN_PROGRESS: <CircleDot className="size-4 text-brand" />,
  DONE: <Check className="size-4 text-emerald-400" />,
  BLOCKED: <Ban className="size-4 text-red-400" />,
};

export function TaskList({ tasks, canEdit }: { tasks: (Task & { assignee?: { name: string | null } | null })[]; canEdit: boolean }) {
  // optimistic local state
  const [items, setItems] = useState(tasks);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function toggle(t: Task) {
    if (!canEdit) return;
    const next = cycle[t.status];
    setBusy(t.id);
    setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, status: next } : x))); // optimistic
    startTransition(async () => {
      await setTaskStatus(t.id, next);
      setBusy(null);
    });
  }

  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No tasks yet.</p>;

  return (
    <ul className="divide-y divide-border">
      {items.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-3">
          <button
            onClick={() => toggle(t)}
            disabled={!canEdit || (busy === t.id && pending)}
            className={cn("flex size-6 items-center justify-center rounded-full border border-border transition-colors",
              canEdit && "hover:border-brand/60", t.status === "DONE" && "border-emerald-500/40 bg-emerald-500/10")}
            aria-label="Toggle task status"
          >
            {busy === t.id && pending ? <Loader2 className="size-3.5 animate-spin" /> : icon[t.status]}
          </button>
          <span className={cn("flex-1 text-sm", t.status === "DONE" && "text-muted-foreground line-through")}>{t.title}</span>
          {t.assignee?.name && <span className="text-xs text-muted-foreground">{t.assignee.name.split(" ")[0]}</span>}
        </li>
      ))}
    </ul>
  );
}
