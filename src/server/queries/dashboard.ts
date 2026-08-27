import { prisma } from "@/lib/prisma";
import { projectProgress } from "./progress";

/** Client dashboard — all numbers computed on each load. */
export async function getClientDashboard(clientId: string) {
  const [projects, invoices, payments, subscription, unreadNotifs] = await Promise.all([
    prisma.project.findMany({
      where: { clientId },
      include: { tasks: true, service: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.invoice.findMany({ where: { clientId } }),
    prisma.payment.findMany({ where: { clientId, status: "SUCCEEDED" } }),
    prisma.subscription.findFirst({
      where: { clientId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      include: { plan: true, planPrice: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where: { user: { client: { id: clientId } }, read: false } }),
  ]);

  const activeProjects = projects.filter((p) => !["DELIVERED", "CANCELLED"].includes(p.status));
  const openTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== "DONE").length;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = invoices.filter((i) => i.status === "OPEN").reduce((s, i) => s + i.total, 0);
  const currency = projects[0]?.currency ?? subscription?.planPrice.currency ?? "USD";

  return {
    projects: projects.map((p) => ({ ...p, progress: projectProgress(p.tasks) })),
    stats: {
      activeProjects: activeProjects.length,
      openTasks,
      totalPaid,
      outstanding,
      unreadNotifs,
      currency,
    },
    subscription,
  };
}

/** Admin dashboard — MRR, revenue, counts, all live. */
export async function getAdminDashboard() {
  const [clients, projects, subs, payments, openInvoices] = await Promise.all([
    prisma.client.count(),
    prisma.project.findMany({ include: { tasks: true } }),
    prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      include: { planPrice: true, plan: true },
    }),
    prisma.payment.findMany({ where: { status: "SUCCEEDED" } }),
    prisma.invoice.findMany({ where: { status: "OPEN" } }),
  ]);

  // MRR normalised to USD for a single headline number (simple demo FX)
  const FX: Record<string, number> = { USD: 1, INR: 0.012, EUR: 1.08, GBP: 1.27 };
  const mrrUsd = subs.reduce((s, sub) => {
    const monthly = sub.planPrice.interval === "YEAR" ? sub.planPrice.amount / 12 : sub.planPrice.amount;
    return s + (monthly / 100) * (FX[sub.planPrice.currency] ?? 1);
  }, 0);

  const revenueUsd = payments.reduce(
    (s, p) => s + (p.amount / 100) * (FX[p.currency] ?? 1),
    0,
  );

  const byStatus = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const activeProjects = projects.filter((p) => !["DELIVERED", "CANCELLED"].includes(p.status)).length;
  const openTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== "DONE").length;

  return {
    stats: {
      clients,
      activeProjects,
      openTasks,
      mrrUsd: Math.round(mrrUsd * 100), // minor units USD
      revenueUsd: Math.round(revenueUsd * 100),
      outstandingCount: openInvoices.length,
      activeSubs: subs.length,
    },
    byStatus,
    subs,
  };
}
