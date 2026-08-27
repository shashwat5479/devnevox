import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 501 });
  }
  const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
  if (!client?.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
  }
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const portal = await stripe.billingPortal.sessions.create({
    customer: client.stripeCustomerId,
    return_url: `${origin}/maintenance`,
  });
  return NextResponse.json({ url: portal.url });
}
