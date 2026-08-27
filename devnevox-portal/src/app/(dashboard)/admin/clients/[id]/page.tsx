import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Phone, Mail } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { projectProgress } from "@/server/queries/progress";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge, SubStatusBadge, InvoiceStatusBadge } from "@/components/status";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminClientDetail({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      user: true, region: true,
      projects: { include: { tasks: true }, orderBy: { updatedAt: "desc" } },
      subscriptions: { include: { plan: true, planPrice: true } },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });
  if (!client) notFound();

  return (
    <>
      <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All clients
      </Link>
      <PageHeader eyebrow={client.region.name} title={client.company} description={client.user.name ?? undefined} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><Avatar name={client.user.name} color={client.avatarColor} /><span className="font-medium">{client.user.name}</span></div>
            <p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4" />{client.user.email}</p>
            {client.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" />{client.phone}</p>}
            {client.website && <p className="flex items-center gap-2 text-muted-foreground"><Globe className="size-4" />{client.website}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {client.projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg border border-border p-3 hover:border-brand/40">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{p.title}</span><ProjectStatusBadge status={p.status} /></div>
                <div className="mt-2 flex items-center gap-2"><Progress value={projectProgress(p.tasks)} className="flex-1" /><span className="text-xs text-muted-foreground">{projectProgress(p.tasks)}%</span></div>
              </Link>
            ))}
            {client.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscriptions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {client.subscriptions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>{s.plan.name} · {formatMoney(s.planPrice.amount, s.planPrice.currency)}/mo</span>
                <SubStatusBadge status={s.status} />
              </div>
            ))}
            {client.subscriptions.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {client.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{inv.number}</span>
                <div className="flex items-center gap-3"><span className="tabular-nums">{formatMoney(inv.total, inv.currency)}</span><InvoiceStatusBadge status={inv.status} /></div>
              </div>
            ))}
            {client.invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
