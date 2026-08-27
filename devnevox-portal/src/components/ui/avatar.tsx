import { cn, initials } from "@/lib/utils";

export function Avatar({ name, image, color, className }: { name?: string | null; image?: string | null; color?: string; className?: string }) {
  return (
    <div
      className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-black/80 ring-1 ring-border overflow-hidden", className)}
      style={{ backgroundColor: image ? undefined : color ?? "hsl(var(--brand))" }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
