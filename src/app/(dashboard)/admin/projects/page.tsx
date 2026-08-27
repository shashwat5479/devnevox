import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { projectProgress } from "@/server/queries/progress";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status";
import { formatRange } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  await requireRole("ADMIN", "TEAM_MEMBER");
  const projects = await prisma.project.findMany({
    include: { tasks: true, client: { include: { user: true } }, service: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <>
      <PageHeader eyebrow="Admin" title="All projects" description={`${projects.length} across all clients.`} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4 font-medium">Project</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Progress</th>
                  <th className="p-4 font-medium">Budget</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/40">
                    <td className="p-4">
                      <Link href={`/projects/${p.id}`} className="font-medium hover:text-brand">{p.title}</Link>
                      <p className="text-xs text-muted-foreground">{p.code}</p>
                    </td>
                    <td className="p-4 text-muted-foreground">{p.client.company}</td>
                    <td className="p-4"><div className="flex w-36 items-center gap-2"><Progress value={projectProgress(p.tasks)} /><span className="text-xs">{projectProgress(p.tasks)}%</span></div></td>
                    <td className="p-4 tabular-nums text-muted-foreground">{formatRange(p.budgetMin, p.budgetMax, p.currency)}</td>
                    <td className="p-4"><ProjectStatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
