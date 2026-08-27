import { redirect } from "next/navigation";
import { CreditCard, Download, Receipt } from "lucide-react";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge, PaymentStatusBadge } from "@/components/status";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { formatMoney } from "@/lib/money";
import { PayButton } from "@/components/payments/pay-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const session = await auth();
  if (session!.user.role !== "CLIENT") redirect("/admin/invoices");

  const client = await prisma.client.findUnique({ where: { userId: session!.user.id } });
  if (!client) redirect("/dashboard");

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({ where: { clientId: client.id }, include: { items: true, project: true }, orderBy: { issuedAt: "desc" } }),
    prisma.payment.findMany({ where: { clientId: client.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const currency = invoices[0]?.currency ?? "USD";
  const paid = payments.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amount, 0);
  const outstanding = invoices.filter((i) => i.status === "OPEN").reduce((s, i) => s + i.total, 0);

  return (
    <>
      <PageHeader eyebrow="Billing" title="Payments & invoices" description="Pay open invoices and download receipts." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total paid" value={formatMoney(paid, currency, { compact: true })} icon={CreditCard} />
        <StatCard label="Outstanding" value={formatMoney(outstanding, currency, { compact: true })} icon={Receipt} accent={outstanding > 0} />
        <StatCard label="Invoices" value={invoices.length} icon={Receipt} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" description="Invoices for your projects will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2.5 pr-4 font-medium">Invoice</th>
                    <th className="py-2.5 pr-4 font-medium">Project</th>
                    <th className="py-2.5 pr-4 font-medium">Issued</th>
                    <th className="py-2.5 pr-4 font-medium">Amount</th>
                    <th className="py-2.5 pr-4 font-medium">Status</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 pr-4 font-medium">{inv.number}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{inv.project?.code ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{format(inv.issuedAt, "d MMM yyyy")}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatMoney(inv.total, inv.currency)}</td>
                      <td className="py-3 pr-4"><InvoiceStatusBadge status={inv.status} /></td>
                      <td className="py-3 pr-4">
                        {inv.status === "OPEN" ? <PayButton invoiceId={inv.id} /> : (
                          <div className="text-right">
                            <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                              <Download className="size-3.5" /> Receipt
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center gap-3">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <span>{formatMoney(p.amount, p.currency)} · {p.method}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{format(p.createdAt, "d MMM yyyy")}</span>
                  <PaymentStatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
