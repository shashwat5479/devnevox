"use client";

import { useState, useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { postMessage } from "@/server/actions/messages";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function MessageComposer({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    if (!body.trim()) return;
    const text = body;
    setBody("");
    start(async () => { await postMessage(projectId, text); });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a message…  use @email to mention someone"
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to send</span>
        <Button size="sm" onClick={submit} disabled={pending || !body.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <>Send <Send className="size-3.5" /></>}
        </Button>
      </div>
    </div>
  );
}
