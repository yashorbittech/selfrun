"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Loader2, RotateCcw, Send, Sparkles, TriangleAlert, X } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string; changes?: { tool: string; ok: boolean }[]; error?: boolean }

const KEY = "cms-ai-agent:chat";
const LABEL: Record<string, string> = {
  update_section: "Edited a section", add_section: "Added a section", remove_section: "Removed a section", move_section: "Moved a section", set_section_enabled: "Showed / hid a section",
  update_page_seo: "Updated page SEO", create_page: "Created a page", delete_page: "Deleted a page", publish_page: "Published a page", menu_add: "Added a menu item", menu_update: "Updated the menu",
  menu_remove: "Removed a menu item", footer_add_column: "Added a footer column", footer_add_link: "Added a footer link", footer_remove: "Updated the footer", update_site_info: "Updated site details",
  set_theme: "Changed the look", generate_image: "Created a photo", rewrite_whole_website: "Rewrote the website",
};
const IDEAS = [
  "Rewrite the home page headline and intro for my business",
  "Add an FAQ section about how to contact us",
  "Change the colours to a calm green theme",
  "Add a new page about our services and put it in the menu",
  "Update my phone number and email in the footer",
];

/** The CMS "Ask AI": a real assistant that reads the site and changes it with the person's own CMS permissions. */
export default function CmsAiAgentDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch { /* unreadable storage */ }
    setMounted(true);
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-30))); } catch { /* storage unavailable */ }
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, busy]);

  async function send(raw?: string) {
    const content = (raw ?? text).trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/cms/ai-agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }) });
      const json = (await res.json().catch(() => null)) as { reply?: string; error?: string; changes?: Msg["changes"] } | null;
      if (!res.ok || !json?.reply) {
        setMessages([...next, { role: "assistant", content: json?.error ?? "Something went wrong. Please try again.", error: true }]);
      } else {
        setMessages([...next, { role: "assistant", content: json.reply, changes: json.changes }]);
        if (json.changes?.some((c) => c.ok)) router.refresh();
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the server. Check your connection and try again.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          key="cms-ai-agent"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed inset-y-0 right-0 z-[1000] flex h-full w-full flex-col border-l border-border/80 bg-background shadow-2xl sm:w-[460px]"
          aria-label="Ask AI"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-accent text-white"><Sparkles className="size-4" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">Website assistant</p>
                <p className="truncate text-[11px] text-muted-foreground">Tell me what to change. I edit your real website.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setMessages([])} title="New conversation" aria-label="New conversation" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><RotateCcw className="size-3.5" /></button>
              <a href="/" target="_blank" rel="noopener noreferrer" title="Open website" aria-label="Open website" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink className="size-3.5" /></a>
              <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
            </div>
          </div>

          <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">I can edit your pages, add sections or whole pages, change the menu and footer, update your contact details, change colours, fonts and layout, and create photos. Changes go live when I publish them. Try:</p>
                <div className="flex flex-col gap-2">
                  {IDEAS.map((i) => (
                    <button key={i} type="button" onClick={() => void send(i)} className="rounded-xl border border-border/70 px-3 py-2 text-left text-sm hover:border-primary/50 hover:bg-primary/5">{i}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[88%] space-y-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : m.error ? "border border-destructive/40 bg-destructive/5 text-foreground" : "bg-muted/60 text-foreground"}`}>
                  {m.error && <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><TriangleAlert className="size-3.5" />Couldn&apos;t finish</p>}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.changes && m.changes.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5 pt-1">
                      {m.changes.map((c, n) => (
                        <li key={n} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${c.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}>
                          {c.ok ? <Check className="size-3" /> : <X className="size-3" />}{LABEL[c.tool] ?? c.tool}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Working on your website…</div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="shrink-0 border-t border-border/60 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                rows={1}
                placeholder="What should I change on your website?"
                aria-label="Message"
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                style={{ outline: "none" }}
              />
              <button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"><Send className="size-4" /></button>
            </div>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body,
  );
}
