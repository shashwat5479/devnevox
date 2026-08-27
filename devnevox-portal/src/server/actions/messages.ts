"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Post a message to a project; @mentions like @[email protected] create Mention rows + notifications. */
export async function postMessage(projectId: string, body: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!body.trim()) return;

  const mentioned = await resolveMentions(body);
  const message = await prisma.message.create({
    data: {
      projectId, senderId: session.user.id, body,
      mentions: { create: mentioned.map((u) => ({ userId: u.id })) },
    },
  });
  await prisma.$transaction([
    prisma.activityLog.create({ data: { projectId, actorId: session.user.id, verb: "commented", summary: "posted a message" } }),
    prisma.notification.createMany({
      data: mentioned.map((u) => ({
        userId: u.id, type: "MENTION" as const, title: `${session.user.name} mentioned you`,
        body: body.slice(0, 80), link: `/projects/${projectId}`,
      })),
    }),
  ]);
  revalidatePath(`/projects/${projectId}`);
  return message.id;
}

async function resolveMentions(body: string) {
  const handles = Array.from(body.matchAll(/@([\w.\-+]+@[\w.\-]+)/g)).map((m) => m[1]);
  if (handles.length === 0) return [];
  return prisma.user.findMany({ where: { email: { in: handles } } });
}
