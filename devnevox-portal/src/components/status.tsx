import { Badge } from "@/components/ui/badge";
import type { ProjectStatus, TaskStatus, InvoiceStatus, SubscriptionStatus, PaymentStatus } from "@prisma/client";

const project: Record<ProjectStatus, { label: string; variant: any }> = {
  NEW: { label: "New", variant: "muted" },
  DISCOVERY: { label: "Discovery", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "In Review", variant: "warning" },
  DELIVERED: { label: "Delivered", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};
const task: Record<TaskStatus, { label: string; variant: any }> = {
  TODO: { label: "To do", variant: "muted" },
  IN_PROGRESS: { label: "In progress", variant: "default" },
  BLOCKED: { label: "Blocked", variant: "danger" },
  DONE: { label: "Done", variant: "success" },
};
const invoice: Record<InvoiceStatus, { label: string; variant: any }> = {
  DRAFT: { label: "Draft", variant: "muted" },
  OPEN: { label: "Open", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  VOID: { label: "Void", variant: "muted" },
  UNCOLLECTIBLE: { label: "Uncollectible", variant: "danger" },
};
const sub: Record<SubscriptionStatus, { label: string; variant: any }> = {
  ACTIVE: { label: "Active", variant: "success" },
  TRIALING: { label: "Trialing", variant: "default" },
  PAST_DUE: { label: "Past due", variant: "warning" },
  CANCELED: { label: "Canceled", variant: "muted" },
  INCOMPLETE: { label: "Incomplete", variant: "warning" },
  UNPAID: { label: "Unpaid", variant: "danger" },
};
const payment: Record<PaymentStatus, { label: string; variant: any }> = {
  PENDING: { label: "Pending", variant: "warning" },
  SUCCEEDED: { label: "Succeeded", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
  REFUNDED: { label: "Refunded", variant: "muted" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = project[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = task[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const s = invoice[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function SubStatusBadge({ status }: { status: SubscriptionStatus }) {
  const s = sub[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = payment[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
