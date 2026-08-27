"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function Topbar({
  role, name, email, image, unread,
}: { role: Role; name?: string | null; email?: string | null; image?: string | null; unread: number }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-8">
        <button className="lg:hidden text-muted-foreground" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>

        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search projects, invoices, clients…"
            className="h-9 w-full rounded-full border border-border bg-card/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4" />
            </Button>
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="ml-1 flex items-center gap-2.5 rounded-full border border-border bg-card/50 py-1 pl-1 pr-3">
            <Avatar name={name} image={image} className="h-7 w-7" />
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium leading-tight">{name}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{role.replace("_", " ").toLowerCase()}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* mobile sidebar toggled from topbar */}
      <div className="lg:hidden">
        <Sidebar role={role} open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </>
  );
}
