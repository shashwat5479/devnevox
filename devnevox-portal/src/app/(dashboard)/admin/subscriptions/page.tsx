import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getAdminDashboard } from "@/server/queries/dashboard";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { SubStatusBadge } from "@/components/status";
import { Avatar } from "@/components/ui/avatar";
import { formatMoney } from "@/lib/money";
import { Repeat } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  await requireRole("ADMIN");
  const [{ stats }, subs] = await Promise.all([
    getAdminDashboard(),
    prisma.subscription.findMany({
      include: { client: { include: { user: true } }, plan: true, planPrice: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Subscriptions" description="All maintenance plans and billing status." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="MRR (USD eq.)" value={formatMoney(stats.mrrUsd, "USD", { compact: true })} icon={Repeat} accent />
        <StatCard label="Active subs" value={stats.activeSubs} icon={Repeat} />
        <StatCard label="Total subs" value={subs.length} icon={Repeat} />
      </div>
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4 font-medium">Client</th><th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Renews</th><th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/40">
                    <td className="p-4"><div className="flex items-center gap-2"><Avatar name={s.client.user.name} color={s.client.avatarColor} className="h-7 w-7 text-[10px]" /><span>{s.client.company}</span></div></td>
                    <td className="p-4">{s.plan.name}</td>
                    <td className="p-4 tabular-nums">{formatMoney(s.planPrice.amount, s.planPrice.currency)}/mo</td>
                    <td className="p-4 text-muted-foreground">{s.currentPeriodEnd ? formatDistanceToNow(s.currentPeriodEnd, { addSuffix: true }) : "—"}</td>
                    <td className="p-4"><SubStatusBadge status={s.status} /></td>
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
