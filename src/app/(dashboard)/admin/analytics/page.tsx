import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAdminDashboard } from "@/server/queries/dashboard";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusPie, RevenueBar } from "@/components/admin/charts";
import { Repeat, Wallet, FolderKanban, Users } from "lucide-react";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  NEW: "New", DISCOVERY: "Discovery", IN_PROGRESS: "In Progress", REVIEW: "Review",
  DELIVERED: "Delivered", MAINTENANCE: "Maintenance", CANCELLED: "Cancelled",
};

export default async function AnalyticsPage() {
  await requireRole("ADMIN");
  const { stats, byStatus, subs } = await getAdminDashboard();

  const statusData = Object.entries(byStatus).map(([k, v]) => ({ name: LABEL[k] ?? k, value: v }));

  // Revenue by plan (active subs, USD eq.)
  const FX: Record<string, number> = { USD: 1, INR: 0.012, EUR: 1.08, GBP: 1.27 };
  const byPlan: Record<string, number> = {};
  for (const s of subs) {
    const usd = (s.planPrice.amount / 100) * (FX[s.planPrice.currency] ?? 1);
    byPlan[s.plan.name] = (byPlan[s.plan.name] ?? 0) + usd;
  }
  const planData = Object.entries(byPlan).map(([name, value]) => ({ name, value: Math.round(value) }));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Analytics" description="Live business metrics, recomputed on every load." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="MRR (USD eq.)" value={formatMoney(stats.mrrUsd, "USD", { compact: true })} icon={Repeat} accent />
        <StatCard label="Revenue (USD eq.)" value={formatMoney(stats.revenueUsd, "USD", { compact: true })} icon={Wallet} />
        <StatCard label="Active projects" value={stats.activeProjects} icon={FolderKanban} />
        <StatCard label="Clients" value={stats.clients} icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Projects by status</CardTitle></CardHeader>
          <CardContent>{statusData.length ? <StatusPie data={statusData} /> : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>MRR by plan (USD eq.)</CardTitle></CardHeader>
          <CardContent>{planData.length ? <RevenueBar data={planData} /> : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}</CardContent>
        </Card>
      </div>
    </>
  );
}
