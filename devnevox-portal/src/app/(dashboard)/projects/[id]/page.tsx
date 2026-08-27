import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Wallet, MessageSquare, FileText, Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectProgress } from "@/server/queries/progress";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRange } from "@/lib/money";
import { TaskList } from "@/components/project/task-list";
import { StatusMover } from "@/components/project/status-mover";
import { MessageComposer } from "@/components/project/message-composer";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  const session = await auth();
  const role = session!.user.role;
  const isStaff = role === "ADMIN" || role === "TEAM_MEMBER";

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: { include: { user: true, region: true } },
      service: true,
      tasks: { include: { assignee: true }, orderBy: { order: "asc" } },
      files: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      messages: {
        include: { sender: true, comments: { include: { author: true } }, mentions: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  // authorization: clients can only see their own project
  if (!isStaff && project.client.userId !== session!.user.id) notFound();

  const progress = projectProgress(project.tasks);
  const c = project.currency;

  return (
    <>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to projects
      </Link>

      <PageHeader
        eyebrow={project.code}
        title={project.title}
        description={project.service?.name}
        action={isStaff ? <StatusMover projectId={project.id} current={project.status} /> : <ProjectStatusBadge status={project.status} />}
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="eyebrow">Progress</p>
          <div className="mt-3 flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm font-semibold tabular-nums">{progress}%</span>
          </div>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Budget</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium"><Wallet className="size-4 text-brand" />{formatRange(project.budgetMin, project.budgetMax, c)}</p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Due</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium"><Calendar className="size-4 text-brand" />{project.dueAt ? format(project.dueAt, "d MMM yyyy") : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="eyebrow">Client</p>
          <div className="mt-2 flex items-center gap-2">
            <Avatar name={project.client.user.name} color={project.client.avatarColor} className="h-7 w-7" />
            <span className="truncate text-sm font-medium">{project.client.company}</span>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: tasks + messages */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <Badge variant="muted">{project.tasks.filter((t) => t.status === "DONE").length}/{project.tasks.length} done</Badge>
            </CardHeader>
            <CardContent>
              <TaskList tasks={project.tasks} canEdit={isStaff} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="size-4 text-brand" /> Discussion</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <MessageComposer projectId={project.id} />
              {project.messages.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No messages yet — start the conversation.</p>
              ) : (
                <div className="space-y-4">
                  {project.messages.map((m) => (
                    <div key={m.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={m.sender.name} image={m.sender.image} className="h-7 w-7" />
                        <span className="text-sm font-medium">{m.sender.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(m.createdAt, { addSuffix: true })}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{highlightMentions(m.body)}</p>
                      {m.comments.length > 0 && (
                        <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
                          {m.comments.map((cm) => (
                            <div key={cm.id} className="text-sm">
                              <span className="font-medium">{cm.author.name}</span>{" "}
                              <span className="text-muted-foreground">{cm.body}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: files + activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-brand" /> Files</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {project.files.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">No files.</p>
              ) : (
                project.files.map((f) => (
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition-colors hover:border-brand/40">
                    <span className="truncate">{f.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">{(f.size / 1e6).toFixed(1)} MB</span>
                  </a>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ActivityIcon className="size-4 text-brand" /> Timeline</CardTitle></CardHeader>
            <CardContent>
              {project.activities.length === 0 ? (
                <EmptyState icon={ActivityIcon} title="No activity yet" className="py-8" />
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-4">
                  {project.activities.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-brand ring-4 ring-background" />
                      <p className="text-sm">
                        <span className="font-medium">{a.actor?.name ?? "System"}</span>{" "}
                        <span className="text-muted-foreground">{a.summary}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(a.createdAt, { addSuffix: true })}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function highlightMentions(text: string) {
  const parts = text.split(/(@[\w.\-+]+@[\w.\-]+)/g);
  return parts.map((p, i) =>
    p.match(/^@[\w.\-+]+@[\w.\-]+$/) ? (
      <span key={i} className="rounded bg-brand/15 px-1 font-medium text-brand">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
