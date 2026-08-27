import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    include: { client: { include: { region: true } } },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Account" title="Settings" description="Manage your profile and workspace." />

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} image={user.image} color={user.client?.avatarColor} className="h-14 w-14 text-base" />
            <div>
              <p className="font-medium">{user.name}</p>
              <Badge variant="muted" className="mt-1">{user.role.replace("_", " ")}</Badge>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Name</Label><Input defaultValue={user.name ?? ""} /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
          </div>
          {user.client && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Company</Label><Input defaultValue={user.client.company} /></div>
              <div className="space-y-2"><Label>Region</Label><Input defaultValue={`${user.client.region.name} (${user.client.region.currency})`} disabled /></div>
            </div>
          )}
          <div className="flex justify-end"><Button>Save changes</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Use the sun/moon toggle in the top bar to switch between dark and light mode. The portal defaults to the devnevoX dark theme.</p>
        </CardContent>
      </Card>
    </div>
  );
}
