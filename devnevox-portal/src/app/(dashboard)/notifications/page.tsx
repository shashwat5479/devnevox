import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NotificationList } from "@/components/notifications/list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  const items = await prisma.notification.findMany({
    where: { userId: session!.user.id }, orderBy: { createdAt: "desc" }, take: 50,
  });
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Inbox" title="Notifications" description="Mentions, payments and project updates." />
      {items.length === 0
        ? <EmptyState icon={Bell} title="You're all caught up" description="No notifications right now." />
        : <NotificationList items={items} />}
    </div>
  );
}
