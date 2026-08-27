"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Self-serve cancel (demo path when Stripe portal isn't wired). */
export async function cancelSubscription(subscriptionId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { client: true } });
  if (!sub) throw new Error("Not found");
  if (session.user.role === "CLIENT" && sub.client.userId !== session.user.id) throw new Error("Forbidden");
  await prisma.subscription.update({ where: { id: subscriptionId }, data: { cancelAtPeriodEnd: true } });
  revalidatePath("/maintenance");
}

/** Switch plan (demo path). Real billing changes go through the Stripe portal. */
export async function changePlan(subscriptionId: string, planId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { client: true } });
  if (!sub) throw new Error("Not found");
  if (session.user.role === "CLIENT" && sub.client.userId !== session.user.id) throw new Error("Forbidden");
  const price = await prisma.planPrice.findFirst({
    where: { planId, regionId: sub.client.regionId, interval: "MONTH", active: true },
  });
  if (!price) throw new Error("No price for your region");
  await prisma.subscription.update({ where: { id: subscriptionId }, data: { planId, planPriceId: price.id, cancelAtPeriodEnd: false } });
  revalidatePath("/maintenance");
}
