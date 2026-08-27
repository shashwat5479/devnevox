"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, PlusCircle, ShieldCheck, CreditCard,
  MessagesSquare, FolderOpen, Bell, Settings, Users, ListChecks,
  Repeat, ReceiptText, BarChart3, FileText, X,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const clientNav: Item[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "My Projects", icon: FolderKanban },
  { href: "/orders/new", label: "New Order", icon: PlusCircle },
  { href: "/maintenance", label: "Maintenance Plan", icon: ShieldCheck },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNav: Item[] = [
  { href: "/admin/clients", label: "All Clients", icon: Users },
  { href: "/admin/projects", label: "All Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Task Management", icon: ListChecks },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Repeat },
  { href: "/admin/invoices", label: "Payments / Invoices", icon: ReceiptText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/content", label: "Content Management", icon: FileText },
];

function NavLink({ item, active, onNavigate }: { item: Item; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-brand/10 text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand shadow-glow-sm" />}
      <Icon className={cn("size-4 shrink-0", active && "text-brand")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ role, open, onClose }: { role: Role; open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button className="lg:hidden text-muted-foreground" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 no-scrollbar">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
            Workspace
          </p>
          {clientNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onClose} />
          ))}

          {role === "ADMIN" && (
            <>
              <p className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                Admin
              </p>
              {adminNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={onClose} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-gradient-to-br from-brand/15 to-transparent p-3 ring-1 ring-brand/20">
            <p className="text-xs font-medium">Need something urgent?</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Ping your delivery pod on Messages.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
