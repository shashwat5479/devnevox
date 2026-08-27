"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function go() {
    setLoading(true); setMsg(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "payment", invoiceId }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (j.url) window.location.href = j.url;
    else setMsg(j.error ?? "Payment unavailable.");
  }
  return (
    <div className="text-right">
      <Button size="sm" onClick={go} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : "Pay now"}
      </Button>
      {msg && <p className="mt-1 text-xs text-amber-400">{msg}</p>}
    </div>
  );
}
