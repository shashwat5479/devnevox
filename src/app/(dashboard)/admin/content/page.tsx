import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  updateService, updatePlanPrice, upsertContentBlock, addFormFieldOption,
} from "@/server/actions/content";
import { DeleteOptionButton } from "@/components/admin/delete-option";

export const dynamic = "force-dynamic";

export default async function ContentManagementPage() {
  await requireRole("ADMIN");

  const [services, plans, blocks, formFields] = await Promise.all([
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.plan.findMany({
      orderBy: { order: "asc" },
      include: { prices: { include: { region: true }, orderBy: { currency: "asc" } } },
    }),
    prisma.contentBlock.findMany({ orderBy: [{ type: "asc" }, { order: "asc" }] }),
    prisma.formField.findMany({
      where: { formKey: "new_order" },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Content management"
        description="Everything here is stored in the database and rendered live — no redeploys." />

      <nav className="mb-6 flex flex-wrap gap-2">
        {[["#services", "Services"], ["#pricing", "Pricing"], ["#content", "FAQ & Terms"], ["#form", "Order form"]].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground hover:border-brand/50 hover:text-foreground">{label}</a>
        ))}
      </nav>

      {/* SERVICES */}
      <section id="services" className="scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold">Services</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <Badge variant={s.active ? "success" : "muted"}>{s.active ? "Active" : "Hidden"}</Badge>
              </CardHeader>
              <CardContent>
                <form action={updateService} className="space-y-3">
                  <input type="hidden" name="id" value={s.id} />
                  <div className="space-y-1.5"><Label>Name</Label><Input name="name" defaultValue={s.name} /></div>
                  <div className="space-y-1.5"><Label>Description</Label><Textarea name="description" defaultValue={s.description} className="min-h-[70px]" /></div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="active" defaultChecked={s.active} className="accent-[hsl(var(--brand))]" /> Visible on site
                    </label>
                    <Button type="submit" size="sm">Save</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mt-10 scroll-mt-24">
        <h2 className="mb-1 text-lg font-semibold">Dynamic pricing</h2>
        <p className="mb-3 text-sm text-muted-foreground">Set per-region monthly prices and Stripe Price IDs. Changes reflect instantly on the site and Maintenance page.</p>
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader><CardTitle className="text-base">{plan.name} <span className="text-muted-foreground font-normal">— {plan.tagline}</span></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {plan.prices.map((price) => (
                  <form key={price.id} action={updatePlanPrice} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
                    <input type="hidden" name="id" value={price.id} />
                    <div className="space-y-1.5">
                      <Label className="text-xs">{price.region.name}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{price.currency}</span>
                        <Input name="amount" type="number" step="0.01" defaultValue={(price.amount / 100).toString()} className="w-32" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5" style={{ minWidth: 220 }}>
                      <Label className="text-xs">Stripe Price ID</Label>
                      <Input name="stripePriceId" defaultValue={price.stripePriceId ?? ""} placeholder="price_..." />
                    </div>
                    <Button type="submit" size="sm">Save</Button>
                  </form>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CONTENT BLOCKS */}
      <section id="content" className="mt-10 scroll-mt-24">
        <h2 className="mb-3 text-lg font-semibold">FAQ, terms & marketing copy</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {blocks.map((b) => (
            <Card key={b.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">{b.title}</CardTitle>
                <Badge variant="muted">{b.type}</Badge>
              </CardHeader>
              <CardContent>
                <form action={upsertContentBlock} className="space-y-3">
                  <input type="hidden" name="id" value={b.id} />
                  <div className="space-y-1.5"><Label>Title</Label><Input name="title" defaultValue={b.title} /></div>
                  <div className="space-y-1.5"><Label>Body</Label><Textarea name="body" defaultValue={b.body} /></div>
                  <div className="flex justify-end"><Button type="submit" size="sm">Save</Button></div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* DYNAMIC FORM */}
      <section id="form" className="mt-10 scroll-mt-24">
        <h2 className="mb-1 text-lg font-semibold">New Order form</h2>
        <p className="mb-3 text-sm text-muted-foreground">Manage the service types and budget ranges clients pick from. These drive the New Order form directly.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {formFields.filter((f) => f.options.length > 0 || f.type === "SELECT" || f.type === "BUDGET_RANGE").map((field) => (
            <Card key={field.id}>
              <CardHeader>
                <CardTitle className="text-base">{field.label}</CardTitle>
                <CardDescription>{field.type} · key “{field.key}”</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {field.options.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <span>{o.label} <span className="text-muted-foreground">({o.value})</span></span>
                      <DeleteOptionButton id={o.id} />
                    </div>
                  ))}
                  {field.options.length === 0 && <p className="text-sm text-muted-foreground">No options yet.</p>}
                </div>
                <form action={addFormFieldOption} className="flex items-end gap-2 border-t border-border pt-3">
                  <input type="hidden" name="fieldId" value={field.id} />
                  <div className="flex-1 space-y-1.5"><Label className="text-xs">Label</Label><Input name="label" placeholder="e.g. E-commerce" required /></div>
                  <div className="flex-1 space-y-1.5"><Label className="text-xs">Value</Label><Input name="value" placeholder="e.g. ecommerce" required /></div>
                  <Button type="submit" size="sm">Add</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
