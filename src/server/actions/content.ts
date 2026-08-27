"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/* ── Content blocks (FAQ / terms / marketing) ── */
export async function upsertContentBlock(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  if (id) {
    await prisma.contentBlock.update({ where: { id }, data: { title, body } });
  }
  revalidatePath("/admin/content");
  revalidatePath("/");
}

/* ── Services ── */
export async function updateService(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  await prisma.service.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/orders/new");
}

/* ── Plan prices (dynamic pricing, no redeploy) ── */
export async function updatePlanPrice(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id"));
  const amountMajor = Number(formData.get("amount"));
  const stripePriceId = String(formData.get("stripePriceId") ?? "").trim() || null;
  await prisma.planPrice.update({
    where: { id },
    data: { amount: Math.round(amountMajor * 100), stripePriceId },
  });
  revalidatePath("/admin/content");
  revalidatePath("/maintenance");
  revalidatePath("/");
}

/* ── Dynamic form field options (New Order dropdowns) ── */
export async function addFormFieldOption(formData: FormData) {
  await requireRole("ADMIN");
  const fieldId = String(formData.get("fieldId"));
  const label = String(formData.get("label"));
  const value = String(formData.get("value"));
  const count = await prisma.formFieldOption.count({ where: { fieldId } });
  await prisma.formFieldOption.create({ data: { fieldId, label, value, order: count } });
  revalidatePath("/admin/content");
  revalidatePath("/orders/new");
}

export async function deleteFormFieldOption(id: string) {
  await requireRole("ADMIN");
  await prisma.formFieldOption.delete({ where: { id } });
  revalidatePath("/admin/content");
  revalidatePath("/orders/new");
}
