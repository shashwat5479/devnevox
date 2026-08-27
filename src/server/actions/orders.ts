"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function code() {
  return "DVX-" + Math.floor(1000 + Math.random() * 9000);
}

export async function createOrder(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const client = await prisma.client.findUnique({ where: { userId: session.user.id }, include: { region: true } });
  if (!client) throw new Error("No client profile");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const serviceSlug = String(formData.get("service") ?? "");
  const budgetValue = String(formData.get("budget") ?? "");
  const deadline = String(formData.get("deadline") ?? "");

  if (!title || !description) throw new Error("Title and description are required");

  const service = serviceSlug ? await prisma.service.findUnique({ where: { slug: serviceSlug } }) : null;
  const budgetOpt = budgetValue
    ? await prisma.formFieldOption.findFirst({ where: { value: budgetValue, field: { key: "budget" } } })
    : null;

  const project = await prisma.project.create({
    data: {
      code: code(),
      title,
      description,
      status: "NEW",
      clientId: client.id,
      serviceId: service?.id ?? null,
      currency: client.region.currency,
      budgetMin: budgetOpt?.min ?? null,
      budgetMax: budgetOpt?.max ?? null,
      dueAt: deadline ? new Date(deadline) : null,
      activities: { create: { actorId: session.user.id, verb: "created", summary: "created the project" } },
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id, type: "PROJECT_UPDATE" as const,
      title: "New order received", body: `${client.company}: ${title}`, link: `/admin/projects`,
    })),
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}
