import { redirect } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubStatusBadge } from "@/components/status";
import { formatMoney } from "@/lib/money";
import { SubscribeButton, SwitchPlanButton, CancelButton, ManageBillingButton } from "@/components/maintenance/plan-actions";

export const dynamic = "force-dynamic";

export default async function MaintenancePage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await auth();
  if (session!.user.role !== "CLIENT") redirect("/admin/subscriptions");

  const client = await prisma.client.findUnique({ where: { userId: session!.user.id }, include: { region: true } });
  if (!client) redirect("/dashboard");

  // Prices pulled live for THIS client's region — editable by admins, no redeploy.
  const [plans, current] = await Promise.all([
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: {
        features: { orderBy: { order: "asc" } },
        prices: { where: { regionId: client.regionId, interval: "MONTH" } },
      },
    }),
    prisma.subscription.findFirst({
      where: { clientId: client.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      include: { plan: true, planPrice: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Maintenance" title="Your care plan"
        description={`Prices shown in ${client.region.currency} for ${client.region.name}. Upgrade, downgrade or cancel anytime.`} />

      {searchParams.status === "success" && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Subscription updated — thank you!
        </div>
      )}

      {current && (
        <Card className="mb-8 shadow-glow">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/30">
                <ShieldCheck className="size-6 text-brand" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{current.plan.name}</p>
                  <SubStatusBadge status={current.status} />
                  {current.cancelAtPeriodEnd && <Badge variant="warning">Cancels at period end</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(current.planPrice.amount, current.planPrice.currency)}/mo
                  {current.currentPeriodEnd && ` · renews ${formatDistanceToNow(current.currentPeriodEnd, { addSuffix: true })}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ManageBillingButton />
              {!current.cancelAtPeriodEnd && <CancelButton subscriptionId={current.id} />}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = plan.prices[0];
          const isCurrent = current?.planId === plan.id;
          return (
            <Card key={plan.id} className={`relative flex flex-col p-7 ${plan.highlight ? "border-brand/50 shadow-glow" : ""} ${isCurrent ? "ring-1 ring-brand/40" : ""}`}>
              {plan.highlight && !isCurrent && <Badge className="absolute right-6 top-6">Most popular</Badge>}
              {isCurrent && <Badge variant="success" className="absolute right-6 top-6">Current</Badge>}
              <h3 className="text-lg font-medium">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-semibold tracking-tight">{price ? formatMoney(price.amount, price.currency) : "—"}</span>
                <span className="mb-1 text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f.id} className={`flex items-start gap-2 ${f.included ? "" : "text-muted-foreground/60 line-through"}`}>
                    <Check className={`mt-0.5 size-4 shrink-0 ${f.included ? "text-brand" : "text-muted-foreground/40"}`} />
                    {f.label}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                {isCurrent ? (
                  <Badge variant="muted" className="w-full justify-center py-2">Your current plan</Badge>
                ) : current ? (
                  <SwitchPlanButton subscriptionId={current.id} planId={plan.id}
                    label={plan.order > current.plan.order ? "Upgrade" : "Downgrade"} />
                ) : (
                  <SubscribeButton planId={plan.id} highlight={plan.highlight} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Live billing changes run through Stripe. When Stripe keys aren't configured, plan switches are applied directly for demo purposes.
      </p>
    </>
  );
}
