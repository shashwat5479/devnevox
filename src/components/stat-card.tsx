import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, hint, accent,
}: { label: string; value: React.ReactNode; icon?: LucideIcon; hint?: string; accent?: boolean }) {
  return (
    <Card className={cn("relative overflow-hidden p-5", accent && "shadow-glow")}>
      {accent && <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/20 blur-2xl" />}
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {Icon && <Icon className={cn("size-4", accent ? "text-brand" : "text-muted-foreground")} />}
      </div>
      <div className="mt-3 stat-number">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
