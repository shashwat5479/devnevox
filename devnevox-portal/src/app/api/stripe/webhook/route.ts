import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = secret && sig ? stripe.webhooks.constructEvent(raw, sig, secret) : (JSON.parse(raw) as Stripe.Event);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const { invoiceId, clientId, planId, planPriceId } = s.metadata ?? {};
      if (s.mode === "payment" && invoiceId && clientId) {
        await prisma.$transaction([
          prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } }),
          prisma.payment.create({
            data: {
              clientId, invoiceId, amount: s.amount_total ?? 0, currency: (s.currency ?? "usd").toUpperCase(),
              status: "SUCCEEDED", stripeCheckoutSessionId: s.id, stripePaymentIntentId: s.payment_intent as string,
            },
          }),
          prisma.activityLog.create({ data: { actorId: null, verb: "paid", summary: `Invoice paid via Stripe` } }),
        ]);
      }
      if (s.mode === "subscription" && clientId && planId && planPriceId) {
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: (s.subscription as string) ?? `pending_${s.id}` },
          create: {
            clientId, planId, planPriceId, status: "ACTIVE",
            stripeSubscriptionId: s.subscription as string,
          },
          update: { status: "ACTIVE", planId, planPriceId },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const map: Record<string, any> = {
        active: "ACTIVE", trialing: "TRIALING", past_due: "PAST_DUE",
        canceled: "CANCELED", incomplete: "INCOMPLETE", unpaid: "UNPAID",
      };
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: map[sub.status] ?? "ACTIVE",
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: inv.subscription as string },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
