import { PrismaClient, Role, ProjectStatus, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);
const daysAhead = (n: number) => new Date(Date.now() + n * 864e5);

async function main() {
  console.log("🌱  Seeding devnevoX portal…");

  // Clean (order matters for FKs)
  await db.$transaction([
    db.mention.deleteMany(),
    db.comment.deleteMany(),
    db.message.deleteMany(),
    db.fileAsset.deleteMany(),
    db.activityLog.deleteMany(),
    db.notification.deleteMany(),
    db.task.deleteMany(),
    db.invoiceItem.deleteMany(),
    db.payment.deleteMany(),
    db.invoice.deleteMany(),
    db.subscription.deleteMany(),
    db.project.deleteMany(),
    db.planPrice.deleteMany(),
    db.planFeature.deleteMany(),
    db.plan.deleteMany(),
    db.formFieldOption.deleteMany(),
    db.formField.deleteMany(),
    db.service.deleteMany(),
    db.contentBlock.deleteMany(),
    db.client.deleteMany(),
    db.account.deleteMany(),
    db.session.deleteMany(),
    db.user.deleteMany(),
    db.region.deleteMany(),
  ]);

  // ── Regions ────────────────────────────────────────────────
  const india = await db.region.create({
    data: { code: "IN", name: "India", currency: "INR", currencySign: "₹", taxLabel: "GST 18%", taxRatePct: 18 },
  });
  const usa = await db.region.create({
    data: { code: "US", name: "United States", currency: "USD", currencySign: "$", taxLabel: "Sales Tax", taxRatePct: 0 },
  });

  // ── Staff users ────────────────────────────────────────────
  const pw = await bcrypt.hash("password123", 10);
  const admin = await db.user.create({
    data: { name: "Aarav Mehta", email: "admin@devnevox.tech", passwordHash: pw, role: Role.ADMIN, image: null },
  });
  const teamLead = await db.user.create({
    data: { name: "Priya Nair", email: "priya@devnevox.tech", passwordHash: pw, role: Role.TEAM_MEMBER },
  });
  const dev = await db.user.create({
    data: { name: "Diego Ramirez", email: "diego@devnevox.tech", passwordHash: pw, role: Role.TEAM_MEMBER },
  });

  // ── Clients ────────────────────────────────────────────────
  async function makeClient(opts: {
    name: string; email: string; company: string; region: string; color: string; website?: string; phone?: string;
  }) {
    const user = await db.user.create({
      data: { name: opts.name, email: opts.email, passwordHash: pw, role: Role.CLIENT },
    });
    return db.client.create({
      data: {
        userId: user.id,
        company: opts.company,
        regionId: opts.region,
        avatarColor: opts.color,
        website: opts.website,
        phone: opts.phone,
      },
      include: { user: true, region: true },
    });
  }

  const nova = await makeClient({
    name: "Rhea Kapoor", email: "rhea@novaretail.in", company: "Nova Retail Labs",
    region: india.id, color: "#22c55e", website: "https://novaretail.in", phone: "+91 98100 22334",
  });
  const orbit = await makeClient({
    name: "Marcus Bell", email: "marcus@orbitfoods.com", company: "Orbit Foods Co.",
    region: usa.id, color: "#38bdf8", website: "https://orbitfoods.com", phone: "+1 (415) 555-0142",
  });
  const zenith = await makeClient({
    name: "Sana Iqbal", email: "sana@zenithclinics.in", company: "Zenith Clinics",
    region: india.id, color: "#a78bfa", website: "https://zenithclinics.in",
  });
  const lumen = await makeClient({
    name: "Elena Fischer", email: "elena@lumenanalytics.io", company: "Lumen Analytics",
    region: usa.id, color: "#f59e0b", website: "https://lumenanalytics.io",
  });

  // ── Services (admin-editable) ──────────────────────────────
  const services = await Promise.all(
    [
      { slug: "web-app", name: "Web App Development", icon: "Code2", order: 1,
        description: "Custom, production-grade web applications built with modern stacks (Next.js, TypeScript, PostgreSQL)." },
      { slug: "mobile-app", name: "Mobile App Development", icon: "Smartphone", order: 2,
        description: "Cross-platform iOS and Android apps with native performance and clean, testable architecture." },
      { slug: "cybersecurity", name: "Security & Compliance", icon: "ShieldCheck", order: 3,
        description: "Threat modelling, penetration testing and compliance hardening — defending the digital, on the dot." },
      { slug: "cloud-devops", name: "Cloud & DevOps", icon: "Cloud", order: 4,
        description: "CI/CD pipelines, infrastructure-as-code and observability on AWS, GCP and Azure." },
      { slug: "ai-ml", name: "AI & Automation", icon: "BrainCircuit", order: 5,
        description: "LLM integrations, data pipelines and workflow automation tailored to your operations." },
      { slug: "design", name: "Product Design", icon: "Palette", order: 6,
        description: "Research-led UX and distinctive UI systems that ship as a real design system, not just mockups." },
    ].map((s) => db.service.create({ data: s })),
  );
  const byService = Object.fromEntries(services.map((s) => [s.slug, s]));

  // ── Plans + multi-currency prices ──────────────────────────
  async function makePlan(opts: {
    slug: string; name: string; tagline: string; description: string; order: number;
    highlight?: boolean; features: { label: string; included: boolean }[];
    inr: number; usd: number;
  }) {
    const plan = await db.plan.create({
      data: {
        slug: opts.slug, name: opts.name, tagline: opts.tagline, description: opts.description,
        order: opts.order, highlight: opts.highlight ?? false,
        features: { create: opts.features.map((f, i) => ({ ...f, order: i })) },
      },
    });
    await db.planPrice.createMany({
      data: [
        { planId: plan.id, regionId: india.id, currency: "INR", amount: opts.inr, interval: "MONTH" },
        { planId: plan.id, regionId: usa.id, currency: "USD", amount: opts.usd, interval: "MONTH" },
      ],
    });
    return db.plan.findUniqueOrThrow({ where: { id: plan.id }, include: { prices: true } });
  }

  const basic = await makePlan({
    slug: "basic", name: "Basic Care", tagline: "Keep the lights on", order: 1,
    description: "Essential monthly maintenance: security patches, uptime monitoring and minor fixes.",
    inr: 499900, usd: 9900,
    features: [
      { label: "Security patches & dependency updates", included: true },
      { label: "Uptime monitoring", included: true },
      { label: "Up to 2 hours of fixes / month", included: true },
      { label: "Priority support", included: false },
      { label: "Monthly performance report", included: false },
    ],
  });
  const standard = await makePlan({
    slug: "standard", name: "Standard Care", tagline: "For growing products", order: 2, highlight: true,
    description: "Everything in Basic plus proactive improvements, priority support and reporting.",
    inr: 1299900, usd: 24900,
    features: [
      { label: "Everything in Basic", included: true },
      { label: "Up to 8 hours of work / month", included: true },
      { label: "Priority support (24h SLA)", included: true },
      { label: "Monthly performance report", included: true },
      { label: "Quarterly roadmap review", included: false },
    ],
  });
  const premium = await makePlan({
    slug: "premium", name: "Premium Care", tagline: "Dedicated partnership", order: 3,
    description: "A dedicated pod, same-day SLA and strategic roadmap work every month.",
    inr: 2999900, usd: 59900,
    features: [
      { label: "Everything in Standard", included: true },
      { label: "Up to 24 hours of work / month", included: true },
      { label: "Same-day SLA + dedicated pod", included: true },
      { label: "Quarterly roadmap review", included: true },
      { label: "Dedicated Slack channel", included: true },
    ],
  });
  const plans = { basic, standard, premium };

  function priceFor(plan: { prices: { regionId: string; id: string }[] }, regionId: string) {
    return plan.prices.find((p) => p.regionId === regionId)!;
  }

  // ── Projects (varied stages) ───────────────────────────────
  async function makeProject(opts: {
    code: string; title: string; description: string; status: ProjectStatus;
    client: { id: string; region: { currency: string } }; serviceSlug: string;
    budgetMin: number; budgetMax: number; startedAt?: Date | null; dueAt?: Date | null;
  }) {
    return db.project.create({
      data: {
        code: opts.code, title: opts.title, description: opts.description, status: opts.status,
        clientId: opts.client.id, serviceId: byService[opts.serviceSlug].id,
        budgetMin: opts.budgetMin, budgetMax: opts.budgetMax, currency: opts.client.region.currency,
        startedAt: opts.startedAt ?? null, dueAt: opts.dueAt ?? null,
      },
    });
  }

  const pNova = await makeProject({
    code: "DVX-1042", title: "Nova Retail — headless commerce rebuild",
    description: "Rebuild the storefront on Next.js with a headless CMS, sub-second search and a redesigned checkout.",
    status: ProjectStatus.IN_PROGRESS, client: nova, serviceSlug: "web-app",
    budgetMin: 80000000, budgetMax: 120000000, startedAt: daysAgo(28), dueAt: daysAhead(35),
  });
  const pOrbit = await makeProject({
    code: "DVX-1043", title: "Orbit Foods — delivery mobile app",
    description: "Native-feel React Native app for scheduled grocery delivery with live order tracking.",
    status: ProjectStatus.REVIEW, client: orbit, serviceSlug: "mobile-app",
    budgetMin: 3500000, budgetMax: 5000000, startedAt: daysAgo(52), dueAt: daysAhead(8),
  });
  const pZenith = await makeProject({
    code: "DVX-1044", title: "Zenith Clinics — patient portal & security audit",
    description: "HIPAA-aligned patient portal plus a full penetration test and compliance report.",
    status: ProjectStatus.DISCOVERY, client: zenith, serviceSlug: "cybersecurity",
    budgetMin: 40000000, budgetMax: 65000000, startedAt: daysAgo(6), dueAt: daysAhead(70),
  });
  const pLumen = await makeProject({
    code: "DVX-1039", title: "Lumen Analytics — dashboard v2",
    description: "Analytics dashboard redesign with real-time charts and role-based sharing.",
    status: ProjectStatus.DELIVERED, client: lumen, serviceSlug: "design",
    budgetMin: 1800000, budgetMax: 2600000, startedAt: daysAgo(120), dueAt: daysAgo(14),
  });
  const projects = [pNova, pOrbit, pZenith, pLumen];

  // ── Tasks per project ──────────────────────────────────────
  const taskSets: Record<string, { title: string; status: TaskStatus; assignee?: string }[]> = {
    [pNova.id]: [
      { title: "Design system & tokens", status: TaskStatus.DONE, assignee: teamLead.id },
      { title: "Product catalog schema", status: TaskStatus.DONE, assignee: dev.id },
      { title: "Headless CMS integration", status: TaskStatus.IN_PROGRESS, assignee: dev.id },
      { title: "Search (Typesense) wiring", status: TaskStatus.IN_PROGRESS, assignee: teamLead.id },
      { title: "Checkout + Stripe", status: TaskStatus.TODO, assignee: dev.id },
      { title: "Perf pass & Lighthouse", status: TaskStatus.TODO },
    ],
    [pOrbit.id]: [
      { title: "Auth & onboarding", status: TaskStatus.DONE, assignee: dev.id },
      { title: "Order tracking screens", status: TaskStatus.DONE, assignee: teamLead.id },
      { title: "Push notifications", status: TaskStatus.DONE, assignee: dev.id },
      { title: "QA regression pass", status: TaskStatus.IN_PROGRESS, assignee: teamLead.id },
      { title: "App Store submission", status: TaskStatus.TODO },
    ],
    [pZenith.id]: [
      { title: "Discovery workshops", status: TaskStatus.IN_PROGRESS, assignee: teamLead.id },
      { title: "Threat model draft", status: TaskStatus.TODO, assignee: dev.id },
      { title: "Compliance gap analysis", status: TaskStatus.TODO },
    ],
    [pLumen.id]: [
      { title: "Chart library eval", status: TaskStatus.DONE, assignee: dev.id },
      { title: "Dashboard redesign", status: TaskStatus.DONE, assignee: teamLead.id },
      { title: "Role-based sharing", status: TaskStatus.DONE, assignee: dev.id },
      { title: "Handoff & docs", status: TaskStatus.DONE, assignee: teamLead.id },
    ],
  };
  for (const [projectId, tasks] of Object.entries(taskSets)) {
    await db.task.createMany({
      data: tasks.map((t, i) => ({
        projectId, title: t.title, status: t.status, assigneeId: t.assignee ?? null,
        order: i, completedAt: t.status === TaskStatus.DONE ? daysAgo(i + 1) : null,
        dueAt: daysAhead(7 + i),
      })),
    });
  }

  // ── Messages, comments, mentions ───────────────────────────
  const m1 = await db.message.create({
    data: {
      projectId: pNova.id, senderId: teamLead.id,
      body: "Pushed the new catalog schema to staging. @Rhea Kapoor could you confirm the category tree matches your merch plan?",
      mentions: { create: [{ userId: nova.userId }] },
    },
  });
  await db.comment.create({
    data: { messageId: m1.id, authorId: nova.userId, body: "Looks great — one tweak: 'Seasonal' should sit above 'Clearance'." },
  });
  await db.comment.create({
    data: { messageId: m1.id, authorId: dev.id, body: "On it, will reorder and redeploy shortly. cc @Priya Nair", mentions: { create: [{ userId: teamLead.id }] } },
  });
  await db.message.create({
    data: {
      projectId: pOrbit.id, senderId: dev.id,
      body: "QA build 42 is up for review. @Marcus Bell the live tracking now updates every 5s.",
      mentions: { create: [{ userId: orbit.userId }] },
    },
  });

  // ── Files ──────────────────────────────────────────────────
  await db.fileAsset.createMany({
    data: [
      { name: "nova-design-system.fig", url: "https://example.com/files/nova-ds.fig", mimeType: "application/figma", size: 4_200_000, projectId: pNova.id, uploadedById: teamLead.id, provider: "s3" },
      { name: "catalog-schema.pdf", url: "https://example.com/files/catalog-schema.pdf", mimeType: "application/pdf", size: 820_000, projectId: pNova.id, uploadedById: dev.id, provider: "s3" },
      { name: "orbit-app-walkthrough.mp4", url: "https://example.com/files/orbit-walkthrough.mp4", mimeType: "video/mp4", size: 18_400_000, projectId: pOrbit.id, uploadedById: dev.id, provider: "cloudinary" },
      { name: "zenith-scope.docx", url: "https://example.com/files/zenith-scope.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 240_000, projectId: pZenith.id, uploadedById: teamLead.id, provider: "s3" },
    ],
  });

  // ── Invoices, items, payments ──────────────────────────────
  async function makeInvoice(opts: {
    number: string; client: { id: string }; project: { id: string }; currency: string;
    items: { description: string; unitAmount: number; quantity?: number }[]; status: "PAID" | "OPEN"; taxRatePct: number;
  }) {
    const subtotal = opts.items.reduce((s, i) => s + i.unitAmount * (i.quantity ?? 1), 0);
    const taxAmount = Math.round((subtotal * opts.taxRatePct) / 100);
    const inv = await db.invoice.create({
      data: {
        number: opts.number, clientId: opts.client.id, projectId: opts.project.id, currency: opts.currency,
        subtotal, taxAmount, total: subtotal + taxAmount, status: opts.status,
        dueAt: daysAhead(10), issuedAt: daysAgo(5),
        items: { create: opts.items.map((i) => ({ description: i.description, unitAmount: i.unitAmount, quantity: i.quantity ?? 1 })) },
      },
    });
    if (opts.status === "PAID") {
      await db.payment.create({
        data: {
          clientId: opts.client.id, invoiceId: inv.id, amount: inv.total, currency: opts.currency,
          status: "SUCCEEDED", method: "card", receiptUrl: "https://pay.stripe.com/receipts/demo",
          stripePaymentIntentId: "pi_demo_" + inv.number.toLowerCase().replace(/\W/g, ""),
        },
      });
    }
    return inv;
  }

  await makeInvoice({
    number: "INV-2026-0007", client: nova, project: pNova, currency: "INR", status: "PAID", taxRatePct: 18,
    items: [{ description: "Milestone 1 — Discovery & design", unitAmount: 30000000 }],
  });
  await makeInvoice({
    number: "INV-2026-0008", client: nova, project: pNova, currency: "INR", status: "OPEN", taxRatePct: 18,
    items: [{ description: "Milestone 2 — Build (sprint 3-4)", unitAmount: 35000000 }],
  });
  await makeInvoice({
    number: "INV-2026-0009", client: orbit, project: pOrbit, currency: "USD", status: "PAID", taxRatePct: 0,
    items: [{ description: "Mobile app — phase 1", unitAmount: 2800000 }],
  });
  await makeInvoice({
    number: "INV-2026-0004", client: lumen, project: pLumen, currency: "USD", status: "PAID", taxRatePct: 0,
    items: [{ description: "Dashboard v2 — full engagement", unitAmount: 2200000 }],
  });

  // ── Subscriptions: one active on each plan ─────────────────
  await db.subscription.create({
    data: {
      clientId: nova.id, planId: plans.premium.id, planPriceId: priceFor(plans.premium, india.id).id,
      status: "ACTIVE", currentPeriodEnd: daysAhead(23), stripeSubscriptionId: "sub_demo_nova",
    },
  });
  await db.subscription.create({
    data: {
      clientId: orbit.id, planId: plans.standard.id, planPriceId: priceFor(plans.standard, usa.id).id,
      status: "ACTIVE", currentPeriodEnd: daysAhead(11), stripeSubscriptionId: "sub_demo_orbit",
    },
  });
  await db.subscription.create({
    data: {
      clientId: lumen.id, planId: plans.basic.id, planPriceId: priceFor(plans.basic, usa.id).id,
      status: "ACTIVE", currentPeriodEnd: daysAhead(4), stripeSubscriptionId: "sub_demo_lumen",
    },
  });

  // ── Activity timeline ──────────────────────────────────────
  const activity = [
    { projectId: pNova.id, actorId: teamLead.id, verb: "moved", summary: "moved project to In Progress", at: daysAgo(20) },
    { projectId: pNova.id, actorId: dev.id, verb: "completed", summary: "completed task “Product catalog schema”", at: daysAgo(9) },
    { projectId: pNova.id, actorId: nova.userId, verb: "paid", summary: "paid invoice INV-2026-0007", at: daysAgo(5) },
    { projectId: pOrbit.id, actorId: dev.id, verb: "uploaded", summary: "uploaded orbit-app-walkthrough.mp4", at: daysAgo(3) },
    { projectId: pOrbit.id, actorId: teamLead.id, verb: "moved", summary: "moved project to Review", at: daysAgo(2) },
    { projectId: pZenith.id, actorId: teamLead.id, verb: "created", summary: "created project", at: daysAgo(6) },
    { projectId: pLumen.id, actorId: teamLead.id, verb: "moved", summary: "marked project Delivered", at: daysAgo(14) },
  ];
  for (const a of activity) {
    await db.activityLog.create({ data: { projectId: a.projectId, actorId: a.actorId, verb: a.verb, summary: a.summary, createdAt: a.at } });
  }

  // ── Notifications ──────────────────────────────────────────
  await db.notification.createMany({
    data: [
      { userId: nova.userId, type: "MENTION", title: "Priya mentioned you", body: "on Nova Retail — headless commerce rebuild", link: `/projects/${pNova.id}` },
      { userId: nova.userId, type: "PAYMENT", title: "Invoice INV-2026-0008 is due", body: "₹4,13,000 due in 10 days", link: "/payments" },
      { userId: orbit.userId, type: "PROJECT_UPDATE", title: "Your app is in Review", body: "Orbit Foods — delivery mobile app", link: `/projects/${pOrbit.id}`, read: true },
      { userId: admin.id, type: "SUBSCRIPTION", title: "New subscription", body: "Nova Retail started Premium Care", link: "/admin/subscriptions" },
    ],
  });

  // ── CMS content blocks ─────────────────────────────────────
  await db.contentBlock.createMany({
    data: [
      { key: "hero.title", type: "MARKETING", title: "Hero title", body: "Defending the Digital, on the Dot." , order: 0 },
      { key: "hero.subtitle", type: "MARKETING", title: "Hero subtitle", body: "We help clients ship secure, scalable software — and keep it healthy long after launch.", order: 1 },
      { key: "terms", type: "TERMS", title: "Terms of Service", order: 0,
        body: "These terms govern your use of the devnevoX client portal. Projects are billed per milestone. Maintenance subscriptions renew monthly and can be cancelled anytime from your Maintenance page. All data is processed in line with our privacy policy." },
      { key: "faq.pricing", type: "FAQ", title: "How does pricing work?", order: 0,
        body: "Project pricing is quoted per engagement. Maintenance is a monthly subscription in your local currency, shown live on the Maintenance page and editable by our team without a redeploy." },
      { key: "faq.regions", type: "FAQ", title: "Do you support multiple currencies?", order: 1,
        body: "Yes. Each client belongs to a region (India / United States today) and sees prices and invoices in that region's currency automatically." },
      { key: "faq.cancel", type: "FAQ", title: "Can I cancel my maintenance plan?", order: 2,
        body: "Absolutely — you can upgrade, downgrade or cancel from the Maintenance page. Cancellations take effect at the end of the current billing period." },
    ],
  });

  // ── Dynamic New Order form config ──────────────────────────
  const serviceField = await db.formField.create({
    data: {
      formKey: "new_order", key: "service", label: "What do you need?", type: "SELECT",
      required: true, order: 0, placeholder: "Choose a service",
      options: { create: services.map((s, i) => ({ label: s.name, value: s.slug, order: i })) },
    },
  });
  const budgetField = await db.formField.create({
    data: {
      formKey: "new_order", key: "budget", label: "Budget range", type: "BUDGET_RANGE", required: true, order: 1,
      options: {
        create: [
          { label: "Under $5k", value: "u5k", min: 0, max: 500000, order: 0 },
          { label: "$5k – $15k", value: "5-15k", min: 500000, max: 1500000, order: 1 },
          { label: "$15k – $40k", value: "15-40k", min: 1500000, max: 4000000, order: 2 },
          { label: "$40k+", value: "40k+", min: 4000000, max: 20000000, order: 3 },
        ],
      },
    },
  });
  await db.formField.create({
    data: { formKey: "new_order", key: "title", label: "Project title", type: "TEXT", required: true, order: 2, placeholder: "e.g. Storefront rebuild" },
  });
  await db.formField.create({
    data: { formKey: "new_order", key: "description", label: "Tell us about the project", type: "TEXTAREA", required: true, order: 3, placeholder: "Goals, timeline, must-haves…" },
  });
  await db.formField.create({
    data: { formKey: "new_order", key: "deadline", label: "Target deadline", type: "DATE", required: false, order: 4 },
  });
  void serviceField; void budgetField;

  console.log("✅  Seed complete.");
  console.log("   Admin login:  admin@devnevox.tech / password123");
  console.log("   Client login: rhea@novaretail.in / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
