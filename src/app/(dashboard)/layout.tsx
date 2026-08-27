import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const unread = await prisma.notification.count({ where: { userId: session.user.id, read: false } });

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar role={session.user.role} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          role={session.user.role}
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
          unread={unread}
        />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
