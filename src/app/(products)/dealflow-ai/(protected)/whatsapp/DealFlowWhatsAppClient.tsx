"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Radio,
  Send,
  Sparkles,
  PhoneCall,
  CheckCheck,
  Briefcase,
  GraduationCap,
  Wrench,
  Building2,
  CheckCircle2,
  BellRing,
  ExternalLink,
  Search,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  listUnifiedContacts,
  listMessagesForContact,
  sendOmnichannelMessage,
  listWhatsAppNotifications,
} from "@/lib/dealflow-ai/store";
import type { PipelineTab, UnifiedPipelineContact, OmnichannelMessage, WhatsAppNotificationLog } from "@/lib/dealflow-ai/types";

const TABS: { id: PipelineTab; label: string; icon: typeof Briefcase }[] = [
  { id: "jobs", label: "Job Applications", icon: Briefcase },
  { id: "interns", label: "Internship", icon: GraduationCap },
  { id: "trainees", label: "Industrial Training", icon: Wrench },
  { id: "clients", label: "Clients", icon: Building2 },
];

export default function DealFlowWhatsAppClient({
  initialTab = "clients",
}: {
  initialMessages?: unknown[];
  initialNotifications?: unknown[];
  leads?: unknown[];
  applications?: unknown[];
  integrationStatus?: unknown;
  initialTab?: PipelineTab;
}) {
  const [activeTab, setActiveTab] = useState<PipelineTab>(initialTab);
  const [viewMode, setViewMode] = useState<"conversations" | "notifications">("conversations");
  const [contacts, setContacts] = useState<UnifiedPipelineContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [messages, setMessages] = useState<OmnichannelMessage[]>([]);
  const [notifications, setNotifications] = useState<WhatsAppNotificationLog[]>([]);
  const [search, setSearch] = useState("");

  // WhatsApp Composer State
  const [outboundText, setOutboundText] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Load contacts for active tab (real DB data)
  useEffect(() => {
    const loaded = listUnifiedContacts(activeTab);
    setContacts(loaded);
    if (loaded.length > 0) {
      setSelectedContactId(loaded[0].id);
    } else {
      setSelectedContactId("");
    }
    setAiRationale(null);

    // Fetch real contacts from MongoDB
    fetch(`/api/dealflow-ai/contacts?pipeline=${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.contacts && data.contacts.length > 0) {
          setContacts(data.contacts);
          setSelectedContactId(data.contacts[0].id);
        }
      })
      .catch(() => {/* keep in-memory fallback */});
  }, [activeTab]);

  // Load WhatsApp messages for selected contact
  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }
    const msgs = listMessagesForContact(selectedContactId, "whatsapp");
    setMessages(msgs);
  }, [selectedContactId]);

  // Load automated notification logs
  useEffect(() => {
    setNotifications(listWhatsAppNotifications());
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? contacts[0] ?? null;

  const handleGenerateAiWhatsApp = async () => {
    if (!selectedContact) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch("/api/dealflow-ai/ai/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "whatsapp",
          category: activeTab,
          contactName: selectedContact.name,
          contactIdentifier: selectedContact.phone,
          clientSource: selectedContact.sourceLabel,
          serviceCategory: selectedContact.titleOrService,
          budgetOrSalary: selectedContact.budgetOrSalary,
          previousMessages: messages.map((m) => ({ sender: m.senderName, text: m.body })),
        }),
      });

      const data = await res.json();
      if (data.ok && data.draft) {
        // Auto-fill directly into WhatsApp text composer!
        setOutboundText(data.draft);
        setAiRationale(data.rationale);
        toast.success("✨ AI WhatsApp response generated and filled into composer! You can edit or send directly.");
      } else {
        toast.error(data.error || "Failed to generate AI WhatsApp response.");
      }
    } catch {
      toast.error("Network error while generating AI WhatsApp response.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendMessage = () => {
    if (!outboundText.trim() || !selectedContact) return;
    setIsSending(true);

    try {
      const newMsg = sendOmnichannelMessage({
        pipeline: activeTab,
        contactId: selectedContact.id,
        channel: "whatsapp",
        direction: "outbound",
        senderName: "DealFlow AI Operations",
        senderIdentifier: "+91 80000 12345",
        recipientIdentifier: selectedContact.phone,
        body: outboundText,
        isAiGenerated: Boolean(aiRationale),
      });

      setMessages((prev) => [...prev, newMsg]);
      setOutboundText("");
      setAiRationale(null);
      toast.success(`WhatsApp message sent to ${selectedContact.phone}!`);
    } catch {
      toast.error("Failed to send WhatsApp message.");
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.titleOrService.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-115px)] min-h-[600px] flex-col gap-3">
      {/* 4 Pipeline Tabs & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-border/60 bg-muted/30 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id && viewMode === "conversations";
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    setViewMode("conversations");
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setViewMode("notifications")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-bold transition-colors",
              viewMode === "notifications"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <BellRing className="size-3.5" />
            <span>Automated Alert Logs ({notifications.length})</span>
          </button>
        </div>

        {viewMode === "conversations" && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab} WhatsApp contacts...`}
              className="rounded-xl pl-9 text-xs"
            />
          </div>
        )}
      </div>

      {viewMode === "conversations" ? (
        /* Main Two-Pane WhatsApp View */
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
          {/* Left Contacts List */}
          <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm md:col-span-4">
            <div className="border-b border-border/60 bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{activeTab.toUpperCase()} WhatsApp ({filteredContacts.length})</span>
              <span className="text-[10px] text-emerald-600 font-bold">Business API</span>
            </div>

            <div className="min-h-0 flex-1 divide-y divide-border/40 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No contacts found in this pipeline.</div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = c.id === selectedContact?.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedContactId(c.id);
                        setAiRationale(null);
                      }}
                      className={cn(
                        "flex w-full flex-col items-start gap-1 p-3.5 text-left transition-colors",
                        isSelected ? "bg-emerald-500/10 border-l-4 border-l-emerald-500" : "hover:bg-muted/40"
                      )}
                    >
                      <div className="flex w-full items-center justify-between text-xs">
                        <span className="font-black text-foreground truncate max-w-[160px]">{c.name}</span>
                        <span className="rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                          {c.source}
                        </span>
                      </div>

                      <span className="text-[11px] text-muted-foreground">{c.phone}</span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[200px]">
                        {c.titleOrService}
                      </span>

                      <div className="mt-1 flex w-full items-center justify-between text-[10px] text-muted-foreground">
                        <span>{c.sourceLabel}</span>
                        <span className="font-bold text-foreground">{c.statusLabel}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right WhatsApp Thread View */}
          <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:col-span-8">
            {selectedContact ? (
              <div className="flex h-full min-h-0 flex-col">
                {/* Header */}
                <div className="border-b border-border/60 bg-muted/20 p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow">
                      <Radio className="size-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-foreground">{selectedContact.name}</h3>
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600">
                          {selectedContact.sourceLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedContact.phone} · Connected via WhatsApp Business Gateway
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dealflow-ai/voice-calls?contactId=${selectedContact.id}&phone=${encodeURIComponent(selectedContact.phone)}&name=${encodeURIComponent(selectedContact.name)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-colors"
                    >
                      <PhoneCall className="size-3.5" /> Call via AI
                    </Link>
                  </div>
                </div>

                {/* WhatsApp Bubbles Thread */}
                <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 bg-muted/5">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground space-y-2">
                      <Radio className="size-8 opacity-30 text-emerald-500" />
                      <p>No prior WhatsApp messages with {selectedContact.name}.</p>
                      <p className="text-[11px]">Click "AI WhatsApp Reply" below to auto-populate a tailored response based on the Knowledge Base.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isOutbound = m.direction === "outbound";
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col max-w-[80%]",
                            isOutbound ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm",
                              isOutbound
                                ? "bg-emerald-600 text-white rounded-tr-none"
                                : "bg-card border border-border/60 text-foreground rounded-tl-none"
                            )}
                          >
                            <div className="whitespace-pre-wrap">{m.body}</div>
                            <div
                              className={cn(
                                "mt-1 flex items-center justify-end gap-1 text-[10px]",
                                isOutbound ? "text-emerald-100" : "text-muted-foreground"
                              )}
                            >
                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {isOutbound && <CheckCheck className="size-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Composer Box with AI Auto-Fill */}
                <div className="border-t border-border/60 bg-muted/20 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Reply via WhatsApp Business
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateAiWhatsApp}
                      disabled={isGeneratingAi}
                      className="gap-1.5 rounded-xl border-emerald-500/30 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shadow-sm"
                    >
                      <Sparkles className="size-3" />
                      {isGeneratingAi ? "Retrieving Knowledge Base..." : "AI WhatsApp Reply"}
                    </Button>
                  </div>

                  {aiRationale && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 px-3 py-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span><strong>AI Auto-Filled:</strong> {aiRationale}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Textarea
                      value={outboundText}
                      onChange={(e) => setOutboundText(e.target.value)}
                      placeholder="Type WhatsApp message or click 'AI WhatsApp Reply' to auto-populate from company Knowledge Base..."
                      rows={3}
                      className="rounded-xl text-xs font-sans leading-relaxed"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        Supports WhatsApp formatting: *bold*, _italics_, and emojis.
                      </span>
                      <Button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSending || !outboundText.trim()}
                        className="gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow"
                      >
                        <Send className="size-3.5" /> Send WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                Select a contact to view WhatsApp chat history.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Automated Alerts Logs View */
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-foreground">
                Automated WhatsApp Alert Notifications
              </h3>
              <p className="text-xs text-muted-foreground">
                Instant notification logs triggered when new Leads, Job Applications, Interns, or Trainees arrive.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600">
              Gateway Status: Online
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white">
                      {n.triggerType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Recipient: <strong>{n.recipientPhone}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>{new Date(n.sentAt).toLocaleString()}</span>
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      {n.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/50 bg-background/80 p-3 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                  {n.messageText}
                </div>

                <div className="flex justify-end">
                  <Link
                    href={n.dealflowLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Open Record in Pipeline <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
