import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import * as Icons from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic"; // always reflect live DB

async function getContent(key: string) {
  const b = await prisma.contentBlock.findUnique({ where: { key } });
  return b?.body;
}

export default async function Landing() {
  // Everything below is pulled live — hero copy, services, plans, prices, FAQ.
  const [heroTitle, heroSubtitle, services, plans, faqs, usRegion] = await Promise.all([
    getContent("hero.title"),
    getContent("hero.subtitle"),
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: { features: { orderBy: { order: "asc" } }, prices: { include: { region: true } } },
    }),
    prisma.contentBlock.findMany({ where: { type: "FAQ", published: true }, orderBy: { order: "asc" } }),
    prisma.region.findFirst({ where: { code: "US" } }),
  ]);

  const priceFor = (plan: (typeof plans)[number]) =>
    plan.prices.find((p) => p.regionId === usRegion?.id) ?? plan.prices[0];

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="container flex h-16 items-center justify-between">
          <Logo href="/" />
          <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/50 px-1.5 py-1 backdrop-blur md:flex">
            {["Services", "Pricing", "FAQ"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="rounded-full px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground">
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link href="/register">Contact us <ArrowRight className="size-3.5" /></Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 aurora opacity-70" />
        <div className="container relative flex min-h-screen flex-col justify-center pb-24 pt-28">
          <p className="eyebrow mb-6">Cyber-grade software delivery</p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-tight sm:text-7xl">
            {heroTitle?.split(",")[0] ?? "Defending the Digital"},
            <br />
            <span className="brand-gradient-text text-glow">
              {heroTitle?.split(",").slice(1).join(",").trim() ?? "on the Dot."}
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            {heroSubtitle ?? "We build secure, scalable software and keep it healthy long after launch."}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg"><Link href="/register">Start a project <ArrowRight className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="pill"><Link href="/login">Client sign in</Link></Button>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-brand" /> Security-first delivery</span>
            <span className="inline-flex items-center gap-2"><Check className="size-4 text-brand" /> Live project portal</span>
            <span className="inline-flex items-center gap-2"><Check className="size-4 text-brand" /> Multi-currency billing</span>
          </div>
        </div>
      </section>

      {/* Services (dynamic) */}
      <section id="services" className="container border-t border-border py-24">
        <p className="eyebrow">What we do</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Know your assets, behaviour, and risks. All in one place.</h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = (Icons as any)[s.icon] ?? Icons.Sparkles;
            return (
              <Card key={s.id} className="group relative overflow-hidden p-6 transition-colors hover:border-brand/40">
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/25">
                  <Icon className="size-5 text-brand" />
                </div>
                <h3 className="mt-5 text-lg font-medium">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing (dynamic, from DB) */}
      <section id="pricing" className="container border-t border-border py-24">
        <p className="eyebrow">Maintenance plans</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Simple, transparent care.</h2>
        <p className="mt-2 text-muted-foreground">Prices shown in USD. Clients are billed automatically in their region&rsquo;s currency.</p>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = priceFor(plan);
            return (
              <Card key={plan.id} className={`relative p-7 ${plan.highlight ? "border-brand/50 shadow-glow" : ""}`}>
                {plan.highlight && <Badge className="absolute right-6 top-6">Most popular</Badge>}
                <h3 className="text-lg font-medium">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{price ? formatMoney(price.amount, price.currency) : "—"}</span>
                  <span className="mb-1 text-sm text-muted-foreground">/mo</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f.id} className={`flex items-start gap-2 ${f.included ? "" : "text-muted-foreground/60 line-through"}`}>
                      <Check className={`mt-0.5 size-4 shrink-0 ${f.included ? "text-brand" : "text-muted-foreground/40"}`} />
                      {f.label}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-7 w-full" variant={plan.highlight ? "default" : "outline"}>
                  <Link href="/register">Get started</Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ (dynamic) */}
      <section id="faq" className="container border-t border-border py-24">
        <p className="eyebrow">Questions</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked.</h2>
        <div className="mt-10 divide-y divide-border rounded-xl border border-border">
          {faqs.map((f) => (
            <details key={f.id} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                {f.title}
                <span className="text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.body}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo href="/" />
          <p>© {new Date().getFullYear()} devnevoX Technology. Defending the Digital, on the Dot.</p>
        </div>
      </footer>
    </div>
  );
}
