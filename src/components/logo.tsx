import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/dashboard" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/40">
        <span className="absolute inset-0 rounded-lg bg-brand/20 blur-md opacity-0 transition-opacity group-hover:opacity-100" />
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="3.2" className="fill-brand stroke-none" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        devnevo<span className="text-brand text-glow">X</span>
      </span>
    </Link>
  );
}
