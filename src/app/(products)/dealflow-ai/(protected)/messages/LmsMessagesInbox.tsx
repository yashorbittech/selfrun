"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Send,
  Sparkles,
  PhoneCall,
  Briefcase,
  GraduationCap,
  Wrench,
  Building2,
  CheckCircle2,
  User,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { listUnifiedContacts, listMessagesForContact, sendOmnichannelMessage } from "@/lib/dealflow-ai/store";
import type { PipelineTab, UnifiedPipelineContact, OmnichannelMessage } from "@/lib/dealflow-ai/types";

const TABS: { id: PipelineTab; label: string; icon: typeof Briefcase }[] = [
  { id: "jobs", label: "Job Applications", icon: Briefcase },
  { id: "interns", label: "Internship", icon: GraduationCap },
  { id: "trainees", label: "Industrial Training", icon: Wrench },
  { id: "clients", label: "Clients", icon: Building2 },
];

export default function LmsMessagesInbox({
  initialLeadId,
}: {
  conversations?: unknown[];
  initialLeadId?: string;
}) {
  const [activeTab, setActiveTab] = useState<PipelineTab>("clients");
  const [contacts, setContacts] = useState<UnifiedPipelineContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [messages, setMessages] = useState<OmnichannelMessage[]>([]);
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  // Load contacts for the active tab (real DB data)
  useEffect(() => {
    const loaded = listUnifiedContacts(activeTab);
    setContacts(loaded);
    if (loaded.length > 0) {
      const match = initialLeadId && loaded.some((c) => c.id === initialLeadId);
      setSelectedContactId(match ? initialLeadId : loaded[0].id);
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
          const newMatch = initialLeadId && data.contacts.some((c: UnifiedPipelineContact) => c.id === initialLeadId);
          setSelectedContactId(newMatch ? initialLeadId! : data.contacts[0].id);
        }
      })
      .catch(() => {/* keep in-memory fallback */});
  }, [activeTab, initialLeadId]);

  // Load messages for selected contact
  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }
    const msgs = listMessagesForContact(selectedContactId, "chat");
    setMessages(msgs);
  }, [selectedContactId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? contacts[0] ?? null;

  const handleGenerateAiReply = async () => {
    if (!selectedContact) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch("/api/dealflow-ai/ai/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "chat",
          category: activeTab,
          contactName: selectedContact.name,
          contactIdentifier: selectedContact.email || selectedContact.phone,
          clientSource: selectedContact.sourceLabel,
          serviceCategory: selectedContact.titleOrService,
          budgetOrSalary: selectedContact.budgetOrSalary,
          previousMessages: messages.map((m) => ({ sender: m.senderName, text: m.body })),
        }),
      });

      const data = await res.json();
      if (data.ok && data.draft) {
        // Auto-fill directly into composer input!
        setInputText(data.draft);
        setAiRationale(data.rationale);
        toast.success("✨ AI response generated and filled into chat composer! You can review, edit, or hit Send.");
      } else {
        toast.error(data.error || "Failed to generate AI response.");
      }
    } catch {
      toast.error("Network error while generating AI response.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedContact) return;

    const newMsg = sendOmnichannelMessage({
      pipeline: activeTab,
      contactId: selectedContact.id,
      channel: "chat",
      direction: "outbound",
      senderName: "Operations Staff (Human Approved)",
      senderIdentifier: "support@selfrun.in",
      recipientIdentifier: selectedContact.email || selectedContact.phone,
      body: inputText,
      isAiGenerated: Boolean(aiRationale),
    });

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setAiRationale(null);
    toast.success("Message dispatched to contact's portal session!");
  };

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.titleOrService.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-115px)] min-h-[600px] flex-col gap-3">
      {/* 4 Pipeline Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-2">
        <div className="flex rounded-xl border border-border/60 bg-muted/30 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {/* Main Two-Pane Chat View */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        {/* Left Contacts List */}
        <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm md:col-span-4">
          <div className="border-b border-border/60 bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>{activeTab.toUpperCase()} Contacts ({filteredContacts.length})</span>
            <span className="text-[10px] text-primary font-bold">Live Synchronized</span>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-border/40 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">No contacts in this pipeline.</div>
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
                      isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="font-black text-foreground truncate max-w-[160px]">{c.name}</span>
                      <span className="rounded-md border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                        {c.source}
                      </span>
                    </div>

                    <span className="text-[11px] text-primary font-semibold truncate max-w-[200px]">
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

        {/* Right Active Chat Window */}
        <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:col-span-8">
          {selectedContact ? (
            <div className="flex h-full min-h-0 flex-col">
              {/* Header */}
              <div className="border-b border-border/60 bg-muted/20 p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-foreground">{selectedContact.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                      {selectedContact.sourceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedContact.email} · {selectedContact.phone} {selectedContact.companyOrCollege ? `· ${selectedContact.companyOrCollege}` : ""}
                  </p>
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

              {/* Chat Thread */}
              <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 bg-muted/5">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground space-y-2">
                    <User className="size-8 opacity-30" />
                    <p>No previous messages with {selectedContact.name}.</p>
                    <p className="text-[11px]">Click "AI Generate Reply" below to instantly auto-fill an inquiry response based on the Knowledge Base.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isStaff = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className={cn("flex flex-col max-w-[80%]", isStaff ? "ml-auto items-end" : "mr-auto items-start")}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm",
                            isStaff
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-card border border-border/60 text-foreground rounded-tl-none"
                          )}
                        >
                          {m.body}
                          <div
                            className={cn(
                              "mt-1 text-[10px] text-right",
                              isStaff ? "text-primary-foreground/75" : "text-muted-foreground"
                            )}
                          >
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer Box with Instant AI Auto-Fill */}
              <div className="border-t border-border/60 bg-muted/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Direct Chat Composer
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAiReply}
                    disabled={isGeneratingAi}
                    className="gap-1.5 rounded-xl border-primary/30 text-xs text-primary hover:bg-primary/10 shadow-sm"
                  >
                    <Sparkles className="size-3" />
                    {isGeneratingAi ? "Querying Knowledge Base..." : "AI Generate Reply"}
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
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your response here or click 'AI Generate Reply' to automatically populate based on company Knowledge Base..."
                    rows={3}
                    className="rounded-xl text-xs font-sans leading-relaxed"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Natural Human Control: Edit any part of the text, then click Send.
                    </span>
                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                      className="gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow"
                    >
                      <Send className="size-3.5" /> Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
              Select a contact to view chat history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
