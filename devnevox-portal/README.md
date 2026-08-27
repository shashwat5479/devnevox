# devnevoX — Client Portal

A full-stack, **fully dynamic, data-driven** client portal for devnevoX Technology.
Built with **Next.js 14 (App Router) · TypeScript · PostgreSQL · Prisma · NextAuth · Stripe · Tailwind + shadcn-style UI**.

Dark, glowing matrix-green aesthetic inspired by the brand reel — _"Defending the Digital, on the Dot."_

---

## Quick start

```bash
# 1. Install deps
npm install

# 2. Start PostgreSQL (or point DATABASE_URL at your own)
docker compose up -d

# 3. Configure env
cp .env.example .env
#   set NEXTAUTH_SECRET  (openssl rand -base64 32)
#   DATABASE_URL already matches docker-compose defaults

# 4. Create schema + seed realistic demo data
npm run db:migrate      # or: npm run db:push
npm run seed

# 5. Run
npm run dev             # http://localhost:3000
```

> **Note on this environment:** `prisma generate` / `migrate` download a query-engine
> binary from `binaries.prisma.sh`. That host was blocked in the sandbox this project
> was authored in, so the client wasn't pre-generated here — it generates normally on
> your machine (it runs automatically via the `postinstall` script).

### Demo logins (after seeding)

| Role   | Email                   | Password      |
| ------ | ----------------------- | ------------- |
| Admin  | `admin@devnevox.tech`   | `password123` |
| Client | `rhea@novaretail.in`    | `password123` |
| Client | `marcus@orbitfoods.com` | `password123` |

---

## What's dynamic (nothing important is hardcoded)

Every requirement below is backed by a database table and rendered server-side:

| Requirement                     | Where it lives                                                              |
| ------------------------------- | -------------------------------------------------------------------------- |
| **Server-rendered, live state** | All pages are `dynamic = "force-dynamic"` server components reading the DB  |
| **Dynamic routing**             | `/projects/[id]`, `/admin/clients/[id]` pull live data                      |
| **Admin-editable content**      | `Service`, `PlanFeature`, `ContentBlock` (FAQ/Terms/marketing) — edited at **Admin → Content Management** |
| **Dynamic pricing table**       | `Plan` + `PlanPrice` (per region/currency, optional Stripe Price ID) — editable, no redeploy |
| **Dynamic dashboards**          | `src/server/queries/dashboard.ts` computes MRR, revenue, progress %, counts on each load |
| **Dynamic New Order form**      | `FormField` + `FormFieldOption` drive the fields/dropdowns/budget ranges    |
| **Auth + roles**                | NextAuth (credentials + optional Google), `Role = CLIENT / ADMIN / TEAM_MEMBER` |
| **CRUD + status pipeline**      | Projects, Tasks (weighted progress bar), Invoices/Payments, Subscriptions   |
| **Stripe test mode**            | Checkout (`/api/stripe/checkout`), webhooks (`/api/stripe/webhook`), billing portal |
| **Messaging + @mentions**       | `Message` / `Comment` / `Mention` (+ notifications), per-project timeline    |
| **Files (S3/Cloudinary)**       | `FileAsset` with provider field; UI wired, storage keys optional            |
| **Analytics + charts**          | `Admin → Analytics` (Recharts, live)                                        |
| **Dark mode / responsive / skeletons / empty states / optimistic UI** | throughout — see `TaskList`, `loading.tsx`, `EmptyState` |

---

## Architecture

```
src/
  app/
    page.tsx                     Marketing landing (dynamic hero/services/pricing/FAQ)
    (auth)/login | register      Auth screens
    (dashboard)/
      layout.tsx                 Sidebar + topbar shell (role-aware)
      dashboard/                 Live client & admin dashboards
      projects/ , projects/[id]/ List + dynamic detail (tasks, messages, files, timeline)
      orders/new/                DB-driven order form
      maintenance/               Region-priced plans + self-serve billing
      payments/                  Invoices + Stripe checkout
      messages/ files/ notifications/ settings/
      admin/                     clients, projects, tasks, subscriptions, invoices,
                                 analytics, content (CMS)
    api/
      auth/[...nextauth]/        NextAuth
      register/                  Email/password sign-up
      stripe/checkout|webhook|portal
  components/                    UI primitives (shadcn-style) + feature components
  lib/                           prisma, auth, stripe, rbac, money, utils
  server/
    queries/                     Live-computed dashboard + progress
    actions/                     Server actions (orders, projects, tasks, messages,
                                 notifications, content, subscriptions)
prisma/
  schema.prisma                  Full data model (20+ models)
  seed.ts                        2 regions, 4 clients, 4 projects, tasks, files,
                                 comments, activity, invoices, payments, subs on each plan
```

## Enabling the optional integrations

- **Google OAuth** — set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; the "Continue with Google" button appears automatically.
- **Stripe (test)** — set `STRIPE_SECRET_KEY` (`sk_test_…`), create products/prices, paste their Price IDs into **Admin → Content → Pricing**. For live webhook sync run `npm run stripe:listen` and set `STRIPE_WEBHOOK_SECRET`. Without keys, checkout returns a friendly message and plan switches apply directly (demo path) so the rest of the portal is fully usable.
- **File storage** — add S3 or Cloudinary keys and wire the upload handler in the Files feature (the `FileAsset` model + UI are ready).

## Scripts

| Script                 | Does                                    |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start dev server                        |
| `npm run build`        | `prisma generate` + production build    |
| `npm run db:migrate`   | Create/apply migrations                 |
| `npm run db:push`      | Push schema without migration history   |
| `npm run seed`         | Seed demo data                          |
| `npm run db:reset`     | Drop, re-migrate, re-seed               |
| `npm run stripe:listen`| Forward Stripe webhooks locally         |

---

_© devnevoX Technology. Defending the Digital, on the Dot._
