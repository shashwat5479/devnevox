import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  return <RegisterForm regions={regions.map((r) => ({ id: r.id, name: r.name, currency: r.currency }))} />;
}
