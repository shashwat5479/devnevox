"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Logo } from "@/components/logo";

export function RegisterForm({ regions }: { regions: { id: string; name: string; currency: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", regionId: regions[0]?.id ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setLoading(false);
      return setError(j.error ?? "Something went wrong.");
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[380px] w-[640px] -translate-x-1/2 aurora opacity-50" />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 flex justify-center"><Logo href="/" /></div>
        <div className="rounded-2xl border border-border bg-card/70 p-8 backdrop-blur-xl shadow-glow">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start your first project with devnevoX.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Your name</Label><Input required value={form.name} onChange={set("name")} placeholder="Jane Doe" /></div>
              <div className="space-y-2"><Label>Company</Label><Input required value={form.company} onChange={set("company")} placeholder="Acme Inc." /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" /></div>
            <div className="space-y-2"><Label>Password</Label><Input type="password" required minLength={8} value={form.password} onChange={set("password")} placeholder="At least 8 characters" /></div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={form.regionId} onChange={set("regionId")}>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.currency})</option>)}
              </Select>
              <p className="text-xs text-muted-foreground">Determines your billing currency.</p>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <>Create account <ArrowRight className="size-4" /></>}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-brand hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
