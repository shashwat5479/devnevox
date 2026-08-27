"use client";

import { useTransition, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changePlan, cancelSubscription } from "@/server/actions/subscriptions";

export function SubscribeButton({ planId, highlight }: { planId: string; highlight?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "subscription", planId }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (j.url) window.location.href = j.url;
    else setMsg(j.error ?? "Checkout unavailable.");
  }

  return (
    <div>
      <Button className="w-full" variant={highlight ? "default" : "outline"} onClick={go} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Choose plan"}
      </Button>
      {msg && <p className="mt-2 text-xs text-amber-400">{msg}</p>}
    </div>
  );
}

export function SwitchPlanButton({ subscriptionId, planId, label }: { subscriptionId: string; planId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending}
      onClick={() => start(() => changePlan(subscriptionId, planId).then(() => {}))}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : label}
    </Button>
  );
}

export function CancelButton({ subscriptionId }: { subscriptionId: string }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirm(true)}>Cancel plan</Button>;
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Cancel at period end?</span>
      <Button variant="destructive" size="sm" disabled={pending}
        onClick={() => start(() => cancelSubscription(subscriptionId).then(() => setConfirm(false)))}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Keep</Button>
    </div>
  );
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    setLoading(true); setMsg(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (j.url) window.location.href = j.url;
    else setMsg(j.error ?? "Billing portal unavailable.");
  }
  return (
    <div>
      <Button variant="outline" size="sm" onClick={go} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Manage billing"}
      </Button>
      {msg && <p className="mt-2 text-xs text-amber-400">{msg}</p>}
    </div>
  );
}
