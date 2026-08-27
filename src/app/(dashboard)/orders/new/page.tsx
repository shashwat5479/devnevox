import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/server/actions/orders";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const session = await auth();
  if (session!.user.role !== "CLIENT") redirect("/dashboard");

  // The entire form definition is data-driven.
  const fields = await prisma.formField.findMany({
    where: { formKey: "new_order", active: true },
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  if (fields.length === 0) {
    return <EmptyState icon={Sparkles} title="Order form not configured" description="An admin needs to add fields under Content Management." />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Get started" title="Start a new order"
        description="Tell us what you need — fields below are configured by our team, not hardcoded." />

      <Card>
        <CardContent className="pt-6">
          <form action={createOrder} className="space-y-5">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="ml-1 text-brand">*</span>}
                </Label>

                {field.type === "TEXT" && (
                  <Input id={field.key} name={field.key} placeholder={field.placeholder ?? ""} required={field.required} />
                )}

                {field.type === "TEXTAREA" && (
                  <Textarea id={field.key} name={field.key} placeholder={field.placeholder ?? ""} required={field.required} className="min-h-[120px]" />
                )}

                {field.type === "DATE" && (
                  <Input id={field.key} name={field.key} type="date" required={field.required} />
                )}

                {(field.type === "SELECT" || field.type === "BUDGET_RANGE") && (
                  <Select id={field.key} name={field.key} required={field.required} defaultValue="">
                    <option value="" disabled>{field.placeholder ?? "Select an option"}</option>
                    {field.options.map((o) => (
                      <option key={o.id} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                )}
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="submit">Submit order</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
