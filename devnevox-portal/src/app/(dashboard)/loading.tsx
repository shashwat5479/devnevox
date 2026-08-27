import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-96" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-4 h-3 w-20" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <Skeleton className="mb-4 h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mb-3 h-16 w-full" />)}
        </Card>
        <Card className="p-6"><Skeleton className="mb-4 h-5 w-28" /><Skeleton className="h-32 w-full" /></Card>
      </div>
    </div>
  );
}
