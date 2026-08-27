import Link from "next/link";
import {
  FolderKanban, ListChecks, Wallet, Clock, Users, Repeat,
  TrendingUp, ArrowRight, ShieldCheck, Activity,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientDashboard, getAdminDashboard } from "@/server/queries/dashboard";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge, SubStatusBadge } from "@/components/status";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/money";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const role = session!.user.role;

  if (role === "ADMIN") return <AdminDashboard />;
  return <ClientDashboard userId={session!.user.id} name={session!.user.name} />;
}

/* ───────────────────────────── Client view ───────────────────────────── */

async function ClientDashboard({ userId, name }: { userId: string; name?: string | null }) {
  const client = await prisma.client.findUnique({ where: { userId } });
  if (!client) {
    return (
      <EmptyState icon={FolderKanban} title="No client profile yet"
        description="Your account isn't linked to a client workspace. Contact your devnevoX admin." />
    );
  }
  const { projects, stats, subscription } = await getClientDashboard(client.id);
  const c = stats.currency;

  return (
    <>
      <PageHeader eyebrow="Overview" title={`Welcome back, ${name?.split(" ")[0] ?? "there"}`}
        description="Here's what's happening across your projects."
        action={<Button asChild><Link href="/orders/new">New order <ArrowRight className="size-4" /></Link></Button>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active projects" value={stats.activeProjects} icon={FolderKanban} accent />
        <StatCard label="Open tasks" value={stats.openTasks} icon={ListChecks} />
        <StatCard label="Total paid" value={formatMoney(stats.totalPaid, c, { compact: true })} icon={Wallet} />
        <StatCard label="Outstanding" value={formatMoney(stats.outstanding, c, { compact: true })} icon={Clock}
          hint={stats.outstanding > 0 ? "Due soon" : "All settled"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your projects</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/projects">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <EmptyState icon={FolderKanban} title="No projects yet"
                description="Start your first project and it will appear here."
                action={<Button asChild size="sm"><Link href="/orders/new">Create order</Link></Button>} />
            ) : (
              projects.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:border-brand/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.code} · {p.service?.name ?? "—"}</p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={p.progress} className="flex-1" />
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{p.progress}%</span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Maintenance plan</CardTitle></CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-brand" />
                    <span className="font-medium">{subscription.plan.name}</span>
                  </div>
                  <SubStatusBadge status={subscription.status} />
                </div>
                <p className="text-2xl font-semibold">
                  {formatMoney(subscription.planPrice.amount, subscription.planPrice.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground">
                    Renews {formatDistanceToNow(subscription.currentPeriodEnd, { addSuffix: true })}
                  </p>
                )}
                <Button asChild variant="outline" className="w-full"><Link href="/maintenance">Manage plan</Link></Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No active plan. Keep your product healthy with monthly care.</p>
                <Button asChild className="w-full"><Link href="/maintenance">View plans</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────────── Admin view ───────────────────────────── */

async function AdminDashboard() {
  const { stats } = await getAdminDashboard();
  const recentActivity = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" }, take: 8,
    include: { actor: true, project: true },
  });
  const recentClients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" }, take: 5, include: { user: true, region: true },
  });

  return (
    <>
      <PageHeader eyebrow="Admin overview" title="Command centre"
        description="Live metrics across every client, project and subscription."
        action={<Button asChild variant="outline"><Link href="/admin/analytics">Full analytics <TrendingUp className="size-4" /></Link></Button>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR (USD eq.)" value={formatMoney(stats.mrrUsd, "USD", { compact: true })} icon={Repeat} accent hint={`${stats.activeSubs} active subs`} />
        <StatCard label="Revenue (USD eq.)" value={formatMoney(stats.revenueUsd, "USD", { compact: true })} icon={Wallet} />
        <StatCard label="Active projects" value={stats.activeProjects} icon={FolderKanban} />
        <StatCard label="Clients" value={stats.clients} icon={Users} hint={`${stats.openTasks} open tasks`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Activity className="size-4 text-brand" /> Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/50">
                <Avatar name={a.actor?.name ?? "System"} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{a.actor?.name ?? "System"}</span>{" "}
                    <span className="text-muted-foreground">{a.summary}</span>
                  </p>
                  {a.project && <p className="text-xs text-muted-foreground">{a.project.code}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(a.createdAt, { addSuffix: true })}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>New clients</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/admin/clients">All</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentClients.map((cl) => (
              <Link key={cl.id} href={`/admin/clients/${cl.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-brand/40">
                <Avatar name={cl.user.name} color={cl.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cl.company}</p>
                  <p className="truncate text-xs text-muted-foreground">{cl.user.name} · {cl.region.name}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
