import Link from "next/link";
import { FolderOpen, FileText, Film, Image as ImageIcon, File } from "lucide-react";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.startsWith("video/")) return Film;
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("document")) return FileText;
  return File;
}

export default async function FilesPage() {
  const session = await auth();
  const role = session!.user.role;
  const isStaff = role === "ADMIN" || role === "TEAM_MEMBER";
  const client = isStaff ? null : await prisma.client.findUnique({ where: { userId: session!.user.id } });

  const files = await prisma.fileAsset.findMany({
    where: isStaff ? {} : { project: { clientId: client?.id ?? "__none__" } },
    include: { project: true, uploadedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader eyebrow="Assets" title="Files"
        description="Deliverables and shared assets. Uploads use S3 or Cloudinary in production." />
      {files.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No files yet" description="Files shared on your projects appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((f) => {
            const Icon = iconFor(f.mimeType);
            return (
              <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                <Card className="h-full transition-colors hover:border-brand/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 ring-1 ring-brand/25">
                        <Icon className="size-4 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{(f.size / 1e6).toFixed(1)} MB · {f.provider}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <Link href={`/projects/${f.projectId}`} className="hover:text-foreground">{f.project?.code}</Link>
                      <span>{format(f.createdAt, "d MMM")}</span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
