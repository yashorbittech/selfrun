"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hubAskAction } from "@/app/workspace/hub-actions";

const LINK = /\[([^\]\n]{1,120})\]\(([^)\s]{1,300})\)/g;

/** Renders the answer as text; `[label](/path)` becomes a link only for same-site paths. */
function Answer({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const [whole, label, href] = m;
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    const internal = href.startsWith("/") && !href.startsWith("//") && !href.includes("\\");
    parts.push(
      internal ? (
        <Link key={at} href={href} className="font-medium text-primary underline-offset-4 hover:underline">
          {label}
        </Link>
      ) : (
        label
      ),
    );
    last = at + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** "Ask about your business": one question, one short answer. Nothing is saved. */
export default function AskBusiness() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <form
        id="hub-ask-form"
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const q = question.trim();
          if (!q || pending) return;
          setReply(null);
          start(async () => {
            try {
              const res = await hubAskAction(q);
              setReply(res.ok ? { ok: true, text: res.answer } : { ok: false, text: res.error });
            } catch {
              setReply({ ok: false, text: "The AI assistant is unavailable right now. Please try again in a moment." });
            }
          });
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Sparkles className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary" />
          <Input
            id="hub-ask-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="Ask about your business, e.g. “How many leads are open?”"
            aria-label="Ask about your business"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Button type="submit" id="hub-ask-submit" className="h-10 rounded-xl px-4" disabled={pending || !question.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null} Ask
        </Button>
      </form>
      <div aria-live="polite">
        {reply && (
          <p id="hub-ask-answer" data-ok={reply.ok} className={reply.ok ? "rounded-xl border bg-background/70 px-3 py-2.5 text-sm break-words whitespace-pre-wrap" : "rounded-xl bg-amber-500/10 px-3 py-2.5 text-sm break-words text-amber-800 dark:text-amber-300"}>
            {reply.ok ? <Answer text={reply.text} /> : reply.text}
          </p>
        )}
      </div>
    </div>
  );
}
