import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskStatusBadge } from "@/components/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
const COLUMNS = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
const TITLES: Record<string, string> = { TODO: "To do", IN_PROGRESS: "In progress", BLOCKED: "Blocked", DONE: "Done" };

export default async function AdminTasksPage() {
  await requireRole("ADMIN", "TEAM_MEMBER");
  const tasks = await prisma.task.findMany({
    include: { project: true, assignee: true },
    orderBy: { updatedAt: "desc" },
  });
  const byCol = Object.fromEntries(COLUMNS.map((c) => [c, tasks.filter((t) => t.status === c)]));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Task management" description="Every task across all projects, grouped by status." />
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <Card key={col}>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">{TITLES[col]}</CardTitle>
              <Badge variant="muted">{byCol[col].length}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {byCol[col].map((t) => (
                <Link key={t.id} href={`/projects/${t.projectId}`} className="block rounded-lg border border-border p-3 hover:border-brand/40">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.project.code}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <TaskStatusBadge status={t.status} />
                    {t.assignee && <Avatar name={t.assignee.name} className="h-6 w-6 text-[10px]" />}
                  </div>
                </Link>
              ))}
              {byCol[col].length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">Empty</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
