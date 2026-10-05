"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Send, Paperclip, FileQuestion, Download, X, MessagesSquare, ExternalLink, StickyNote } from "lucide-react";
import GlassCard from "@/components/lms/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendLeadMessageAction } from "../leads/actions";
import type { SerializedLeadMessage, LeadMessageAttachment } from "@/lib/lead-management/types";
import type { LeadConversationSummary } from "@/lib/lead-management/messages";

const TYPE_LABEL: Record<string, string> = {
  job_applicant: "Job Applicant",
  intern: "Intern",
  trainee: "Trainee",
  client: "Client",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function AttachmentView({ a }: { a: LeadMessageAttachment }) {
  const url = `/api/lead-messages/files/${a.storageKey}`;
  if (a.kind === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 block max-w-[200px] overflow-hidden rounded-xl border border-border/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={a.filename} className="max-h-48 w-full object-cover" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="lms-chip mt-1.5 max-w-[200px] hover:border-primary/40">
      <Download className="size-3" />
      <span className="truncate">{a.filename}</span>
      <span className="text-muted-foreground/70">{(a.size / 1024).toFixed(0)} KB</span>
    </a>
  );
}

export default function LmsMessagesInbox({
  conversations,
  initialLeadId,
}: {
  conversations: LeadConversationSummary[];
  initialLeadId?: string;
}) {
  const [convos, setConvos] = useState(conversations);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    (initialLeadId && conversations.some((c) => c.leadId === initialLeadId) ? initialLeadId : conversations[0]?.leadId) ?? null
  );
  const [messages, setMessages] = useState<SerializedLeadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState("");
  const [docReq, setDocReq] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef(new Set<string>());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return convos;
    return convos.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [convos, query]);

  const selected = convos.find((c) => c.leadId === selectedId) ?? null;

  // Load the full thread whenever the selected lead changes, and clear its unread flag.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingThread(true);
    fetch(`/api/lms/leads/${selectedId}/messages`)
      .then((res) => res.json())
      .then((json: { messages?: SerializedLeadMessage[] }) => {
        if (cancelled) return;
        const msgs = json.messages ?? [];
        seenIds.current = new Set(msgs.map((m) => m._id));
        setMessages(msgs);
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    setConvos((prev) => prev.map((c) => (c.leadId === selectedId ? { ...c, hasUnreadPortalReply: false } : c)));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Live updates for whichever conversation is open.
  useEffect(() => {
    if (!selectedId) return;
    const source = new EventSource(`/api/lms/leads/${selectedId}/messages/stream`);
    source.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data) as { type: string; event?: { kind: string; payload: { message?: SerializedLeadMessage } } };
        if (data.type !== "event" || data.event?.kind !== "message") return;
        const message = data.event.payload.message;
        if (!message || message.visibility !== "portal" || seenIds.current.has(message._id)) return;
        seenIds.current.add(message._id);
        setMessages((prev) => [...prev, message]);
        setConvos((prev) => {
          const idx = prev.findIndex((c) => c.leadId === selectedId);
          if (idx === -1) return prev;
          const updated = { ...prev[idx], lastMessage: message, messageCount: prev[idx].messageCount + 1 };
          return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        });
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => source.close();
  }, [selectedId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = "";
  }

  async function submit() {
    if (!selectedId || (!text.trim() && !file)) return;
    setUploading(true);
    try {
      let attachments: LeadMessageAttachment[] = [];
      if (file) {
        const form = new FormData();
        form.append("file", file);
        form.append("leadId", selectedId);
        const res = await fetch("/api/lead-messages/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed.");
        attachments = [json.attachment];
      }
      const body = text;
      start(async () => {
        const res = await sendLeadMessageAction(selectedId, body, docReq ? "document_request" : "message", attachments);
        if (res.error) return void toast.error(res.error);
        setText("");
        setDocReq(false);
        setFile(null);
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that message.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[20rem_1fr]">
      {/* Conversation list */}
      <GlassCard interactive={false} containerClassName="min-h-0 h-full flex flex-col">
        <div className="flex flex-col gap-2 border-b border-border/50 p-3">
          <p className="text-sm font-semibold text-foreground">Conversations</p>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search leads…"
              className="w-full rounded-xl border border-border/50 bg-background py-1.5 pr-3 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No conversations yet.</p>}
          {filtered.map((c) => (
            <button
              key={c.leadId}
              onClick={() => setSelectedId(c.leadId)}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b border-border/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                selectedId === c.leadId && "bg-primary/10"
              )}
            >
              <div className="flex items-center gap-1.5">
                {c.hasUnreadPortalReply && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                <span className={cn("truncate text-sm", c.hasUnreadPortalReply ? "font-bold text-foreground" : "font-medium text-foreground")}>{c.name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{timeAgo(c.lastMessage.createdAt)}</span>
              </div>
              <p className={cn("truncate text-xs", c.hasUnreadPortalReply ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {c.lastMessage.authorType === "staff" ? "You: " : ""}
                {c.lastMessage.body || (c.lastMessage.attachments.length ? "Sent an attachment" : "")}
              </p>
              <span className="text-[10px] text-muted-foreground">{TYPE_LABEL[c.type] ?? c.type} · {c.code}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Thread */}
      <GlassCard interactive={false} containerClassName="min-h-0 h-full flex flex-col">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <MessagesSquare className="size-6" />
            <p className="text-sm">Select a conversation to view messages.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[selected.type] ?? selected.type} · {selected.code} · {selected.email}</p>
              </div>
              <Link href={`/lms/leads/${selected.leadId}`} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Open full lead <ExternalLink className="size-3" />
              </Link>
            </div>

            <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {loadingThread && <p className="py-4 text-center text-xs text-muted-foreground">Loading…</p>}
              {!loadingThread && messages.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No messages yet.</p>}
              {messages.map((m) => {
                const mine = m.authorType === "staff";
                return (
                  <div key={m._id} className={cn("flex", mine && "justify-end")}>
                    <div className={cn("max-w-[75%] rounded-2xl border px-3 py-2 text-sm", mine ? "border-primary/20 bg-primary/10" : "border-border/50 bg-card")}>
                      <div className="mb-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {mine ? <Send className="size-3" /> : <StickyNote className="size-3" />}
                        {m.channel === "document_request" ? "Document request" : mine ? "You" : selected.name}
                        <span className="ml-auto">{when(m.createdAt)}</span>
                      </div>
                      {m.body && <p className="whitespace-pre-wrap text-foreground">{m.body}</p>}
                      {m.attachments.map((a) => (
                        <AttachmentView key={a.storageKey} a={a} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-t border-border/50 p-3">
              {file && (
                <div className="lms-chip max-w-full">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">
                    <X className="size-3" />
                  </button>
                </div>
              )}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Write a message the lead sees in their portal…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={submit} disabled={pending || uploading || (!text.trim() && !file)}>
                  Send
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} />
                <Button type="button" variant="outline" size="icon-sm" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file">
                  <Paperclip className="size-3.5" />
                </Button>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <input type="checkbox" checked={docReq} onChange={(e) => setDocReq(e.target.checked)} />
                  <FileQuestion className="size-3.5" /> This is a document request
                </label>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
