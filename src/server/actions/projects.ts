"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@prisma/client";

export async function moveProject(projectId: string, status: ProjectStatus) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "TEAM_MEMBER"].includes(session.user.role)) {
    throw new Error("Not authorized");
  }
  await prisma.$transaction([
    prisma.project.update({ where: { id: projectId }, data: { status } }),
    prisma.activityLog.create({
      data: { projectId, actorId: session.user.id, verb: "moved", summary: `moved project to ${status.replace("_", " ").toLowerCase()}` },
    }),
  ]);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/admin/projects");
}
