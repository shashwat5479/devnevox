"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell, Check, AtSign, CreditCard, Repeat, FolderKanban, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Notification, NotificationType } from "@prisma/client";
import { markAllRead, markRead } from "@/server/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  MENTION: AtSign, PAYMENT: CreditCard, SUBSCRIPTION: Repeat,
  PROJECT_UPDATE: FolderKanban, TASK_ASSIGNED: Check, MESSAGE: MessageSquare, SYSTEM: Bell,
};

export function NotificationList({ items }: { items: Notification[] }) {
  const [pending, start] = useTransition();
  const hasUnread = items.some((n) => !n.read);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" disabled={!hasUnread || pending} onClick={() => start(() => markAllRead())}>
          <Check className="size-3.5" /> Mark all read
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((n) => {
          const Icon = icons[n.type];
          const body = (
            <div className={cn("flex items-start gap-3 rounded-lg border p-4 transition-colors",
              n.read ? "border-border bg-card" : "border-brand/30 bg-brand/5")}>
              <div className={cn("flex size-9 items-center justify-center rounded-lg ring-1",
                n.read ? "bg-muted ring-border" : "bg-brand/15 ring-brand/30")}>
                <Icon className={cn("size-4", n.read ? "text-muted-foreground" : "text-brand")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</p>
              </div>
              {!n.read && (
                <button onClick={(e) => { e.preventDefault(); start(() => markRead(n.id)); }}
                  className="shrink-0 text-xs text-brand hover:underline">Mark read</button>
              )}
            </div>
          );
          return n.link ? <Link key={n.id} href={n.link}>{body}</Link> : <div key={n.id}>{body}</div>;
        })}
      </div>
    </div>
  );
}
