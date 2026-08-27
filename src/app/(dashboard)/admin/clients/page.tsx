import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  await requireRole("ADMIN");
  const clients = await prisma.client.findMany({
    include: { user: true, region: true, _count: { select: { projects: true, subscriptions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader eyebrow="Admin" title="All clients" description={`${clients.length} client workspaces.`} />
      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`}>
              <Card className="h-full transition-colors hover:border-brand/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.user.name} color={c.avatarColor} className="h-11 w-11 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.company}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.user.name} · {c.user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="muted">{c.region.name}</Badge>
                    <Badge variant="secondary">{c._count.projects} projects</Badge>
                    <Badge variant="secondary">{c._count.subscriptions} subs</Badge>
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
