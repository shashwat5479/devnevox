import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <EmptyState icon={SearchX} title="Not found"
      description="This page doesn't exist or you don't have access to it."
      action={<Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>} />
  );
}
