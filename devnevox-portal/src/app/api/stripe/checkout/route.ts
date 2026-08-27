import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";

const schema = z.object({
  mode: z.enum(["payment", "subscription"]),
  invoiceId: z.string().optional(),
  planId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripeEnabled() || !stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env to enable checkout." },
      { status: 501 },
    );
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: { region: true },
  });
  if (!client) return NextResponse.json({ error: "No client profile" }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  // Ensure a Stripe customer exists
  let customerId = client.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: client.company,
      metadata: { clientId: client.id },
    });
    customerId = customer.id;
    await prisma.client.update({ where: { id: client.id }, data: { stripeCustomerId: customerId } });
  }

  if (body.data.mode === "payment" && body.data.invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: body.data.invoiceId } });
    if (!invoice || invoice.clientId !== client.id) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      success_url: `${origin}/payments?status=success`,
      cancel_url: `${origin}/payments?status=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: invoice.currency.toLowerCase(),
            unit_amount: invoice.total,
            product_data: { name: `Invoice ${invoice.number}` },
          },
        },
      ],
      metadata: { invoiceId: invoice.id, clientId: client.id },
    });
    return NextResponse.json({ url: checkout.url });
  }

  if (body.data.mode === "subscription" && body.data.planId) {
    const price = await prisma.planPrice.findFirst({
      where: { planId: body.data.planId, regionId: client.regionId, interval: "MONTH", active: true },
    });
    if (!price?.stripePriceId) {
      return NextResponse.json(
        { error: "This plan has no Stripe price for your region yet. An admin can add one from Content/Subscriptions." },
        { status: 400 },
      );
    }
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      success_url: `${origin}/maintenance?status=success`,
      cancel_url: `${origin}/maintenance?status=cancelled`,
      line_items: [{ price: price.stripePriceId, quantity: 1 }],
      metadata: { planId: body.data.planId, planPriceId: price.id, clientId: client.id },
    });
    return NextResponse.json({ url: checkout.url });
  }

  return NextResponse.json({ error: "Nothing to check out" }, { status: 400 });
}
