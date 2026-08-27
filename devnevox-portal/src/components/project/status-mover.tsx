"use client";

import { useTransition } from "react";
import type { ProjectStatus } from "@prisma/client";
import { moveProject } from "@/server/actions/projects";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const STATUSES: ProjectStatus[] = ["NEW", "DISCOVERY", "IN_PROGRESS", "REVIEW", "DELIVERED", "MAINTENANCE", "CANCELLED"];

export function StatusMover({ projectId, current }: { projectId: string; current: ProjectStatus }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      <Select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => start(() => moveProject(projectId, e.target.value as ProjectStatus))}
        className="w-44"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </Select>
    </div>
  );
}
