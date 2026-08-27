import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectProgress } from "@/server/queries/progress";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status";
import { EmptyState } from "@/components/empty-state";
import { formatRange } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();
  const role = session!.user.role;
  const isStaff = role === "ADMIN" || role === "TEAM_MEMBER";

  const client = isStaff ? null : await prisma.client.findUnique({ where: { userId: session!.user.id } });

  const projects = await prisma.project.findMany({
    where: isStaff ? {} : { clientId: client?.id ?? "__none__" },
    include: { tasks: true, service: true, client: { include: { user: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader eyebrow="Delivery" title={isStaff ? "All projects" : "My projects"}
        description="Live status, progress and budgets — updated on every load."
        action={!isStaff && <Button asChild><Link href="/orders/new">New order <ArrowRight className="size-4" /></Link></Button>} />

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet"
          description={isStaff ? "New client orders will show up here." : "Start your first project to see it here."}
          action={!isStaff && <Button asChild size="sm"><Link href="/orders/new">Create order</Link></Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const progress = projectProgress(p.tasks);
            const done = p.tasks.filter((t) => t.status === "DONE").length;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="group h-full transition-colors hover:border-brand/40">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{p.code}</p>
                        <h3 className="mt-0.5 truncate font-medium group-hover:text-brand">{p.title}</h3>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    {isStaff && <p className="mt-2 text-xs text-muted-foreground">{p.client.company} · {p.client.user.name}</p>}
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={progress} className="flex-1" />
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{done}/{p.tasks.length} tasks</span>
                      <span>{formatRange(p.budgetMin, p.budgetMax, p.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
