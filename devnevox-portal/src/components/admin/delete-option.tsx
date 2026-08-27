"use client";
import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteFormFieldOption } from "@/server/actions/content";

export function DeleteOptionButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button onClick={() => start(() => deleteFormFieldOption(id))} disabled={pending}
      className="text-muted-foreground hover:text-red-400" aria-label="Delete option">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
