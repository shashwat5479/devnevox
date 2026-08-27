import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/status";
import { formatMoney } from "@/lib/money";
import { Receipt, Wallet, Clock } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  await requireRole("ADMIN");
  const invoices = await prisma.invoice.findMany({
    include: { client: true, project: true }, orderBy: { issuedAt: "desc" },
  });

  const FX: Record<string, number> = { USD: 1, INR: 0.012, EUR: 1.08, GBP: 1.27 };
  const paidUsd = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + (i.total / 100) * (FX[i.currency] ?? 1), 0);
  const openUsd = invoices.filter((i) => i.status === "OPEN").reduce((s, i) => s + (i.total / 100) * (FX[i.currency] ?? 1), 0);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Payments & invoices" description="Billing across every client." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Collected (USD eq.)" value={formatMoney(Math.round(paidUsd * 100), "USD", { compact: true })} icon={Wallet} accent />
        <StatCard label="Outstanding (USD eq.)" value={formatMoney(Math.round(openUsd * 100), "USD", { compact: true })} icon={Clock} />
        <StatCard label="Invoices" value={invoices.length} icon={Receipt} />
      </div>
      <Card className="mt-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4 font-medium">Invoice</th><th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Issued</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-accent/40">
                    <td className="p-4 font-medium">{inv.number}</td>
                    <td className="p-4 text-muted-foreground">{inv.client.company}</td>
                    <td className="p-4 text-muted-foreground">{format(inv.issuedAt, "d MMM yyyy")}</td>
                    <td className="p-4 tabular-nums">{formatMoney(inv.total, inv.currency)}</td>
                    <td className="p-4"><InvoiceStatusBadge status={inv.status} /></td>
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
