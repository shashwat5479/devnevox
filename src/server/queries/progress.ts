import type { Task } from "@prisma/client";

/** Weighted completion % for a project's tasks — computed live, never stored. */
export function projectProgress(tasks: Pick<Task, "status" | "weight">[]) {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((s, t) => s + (t.weight || 1), 0);
  const done = tasks
    .filter((t) => t.status === "DONE")
    .reduce((s, t) => s + (t.weight || 1), 0);
  return Math.round((done / total) * 100);
}
