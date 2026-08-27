import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  const role = session!.user.role;
  const isStaff = role === "ADMIN" || role === "TEAM_MEMBER";
  const client = isStaff ? null : await prisma.client.findUnique({ where: { userId: session!.user.id } });

  const messages = await prisma.message.findMany({
    where: isStaff ? {} : { project: { clientId: client?.id ?? "__none__" } },
    include: { sender: true, project: true, mentions: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <>
      <PageHeader eyebrow="Collaboration" title="Messages"
        description="Every conversation across your projects, newest first." />
      {messages.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No messages yet"
          description="Open a project and start the discussion — @mention teammates to loop them in." />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Link key={m.id} href={`/projects/${m.projectId}`}>
              <Card className="transition-colors hover:border-brand/40">
                <CardContent className="flex items-start gap-3 p-4">
                  <Avatar name={m.sender.name} image={m.sender.image} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{m.sender.name}</span>
                      <span className="text-xs text-muted-foreground">in {m.project.code}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(m.createdAt, { addSuffix: true })}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.body}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
