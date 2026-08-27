"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  if (session.user.role !== "CLIENT") {
    await prisma.activityLog.create({
      data: { projectId: task.projectId, actorId: session.user.id, verb: "updated",
        summary: `set task “${task.title}” to ${status.replace("_", " ").toLowerCase()}` },
    });
  }
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/admin/tasks");
}

export async function addTask(projectId: string, title: string) {
  const session = await auth();
  if (!session?.user || session.user.role === "CLIENT") throw new Error("Not authorized");
  const count = await prisma.task.count({ where: { projectId } });
  await prisma.task.create({ data: { projectId, title, order: count } });
  revalidatePath(`/projects/${projectId}`);
}
