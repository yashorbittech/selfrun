"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Paperclip,
  Download,
  Plus,
  Search,
  Sparkles,
  Inbox,
  ArrowUpRight,
  PhoneCall,
  X,
  Briefcase,
  GraduationCap,
  Wrench,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import Link from "next/link";
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

export default function DealFlowEmailClient({
  initialTab = "clients",
}: {
  initialMessages?: unknown[];
  leads?: unknown[];
  applications?: unknown[];
  initialTab?: PipelineTab;
}) {
  const [activeTab, setActiveTab] = useState<PipelineTab>(initialTab);
  const [contacts, setContacts] = useState<UnifiedPipelineContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [messages, setMessages] = useState<OmnichannelMessage[]>([]);
  const [search, setSearch] = useState("");

  // Email Reply Box State
  const [subjectText, setSubjectText] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ id: string; filename: string; size: number; url: string; contentType: string }[]>([]);
  const [isSending, setIsSending] = useState(false);

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

  // Load email messages for selected contact
  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }
    const msgs = listMessagesForContact(selectedContactId, "email");
    setMessages(msgs);
  }, [selectedContactId]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? contacts[0] ?? null;

  const handleGenerateAiEmail = async () => {
    if (!selectedContact) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetch("/api/dealflow-ai/ai/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          category: activeTab,
          contactName: selectedContact.name,
          contactIdentifier: selectedContact.email,
          clientSource: selectedContact.sourceLabel,
          serviceCategory: selectedContact.titleOrService,
          budgetOrSalary: selectedContact.budgetOrSalary,
          previousMessages: messages.map((m) => ({ sender: m.senderName, text: m.body })),
        }),
      });

      const data = await res.json();
      if (data.ok && data.draft) {
        // Auto-fill directly into Email Subject and Body!
        setEmailBody(data.draft);
        if (data.subject) setSubjectText(data.subject);
        setAiRationale(data.rationale);
        toast.success("✨ AI response generated and filled into email body! You can edit or send directly.");
      } else {
        toast.error(data.error || "Failed to generate AI email.");
      }
    } catch {
      toast.error("Network error while generating AI email.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendEmail = () => {
    if (!emailBody.trim() || !selectedContact) return;
    setIsSending(true);

    try {
      const newMsg = sendOmnichannelMessage({
        pipeline: activeTab,
        contactId: selectedContact.id,
        channel: "email",
        direction: "outbound",
        senderName: "SelfRun DealFlow Operations",
        senderIdentifier: "deals@selfrun.in",
        recipientIdentifier: selectedContact.email,
        subject: subjectText || `Update on ${selectedContact.titleOrService}`,
        body: emailBody,
        attachments,
        isAiGenerated: Boolean(aiRationale),
      });

      setMessages((prev) => [...prev, newMsg]);
      setEmailBody("");
      setSubjectText("");
      setAttachments([]);
      setAiRationale(null);
      toast.success(`Email successfully dispatched to ${selectedContact.email}!`);
    } catch {
      toast.error("Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  const addSampleAttachment = () => {
    const file = {
      id: `att-${Date.now()}`,
      filename: "SelfRun_Project_Scope_Estimate.pdf",
      size: 480000,
      url: "/files/scope.pdf",
      contentType: "application/pdf",
    };
    setAttachments((prev) => [...prev, file]);
    toast.success("Attached SelfRun_Project_Scope_Estimate.pdf");
  };

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.titleOrService.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
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
                    ? "bg-purple-600 text-white shadow-sm"
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
            placeholder={`Search ${activeTab} emails...`}
            className="rounded-xl pl-9 text-xs"
          />
        </div>
      </div>

      {/* Main Two-Pane Email Client */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        {/* Left Contacts List */}
        <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm md:col-span-4">
          <div className="border-b border-border/60 bg-muted/20 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>{activeTab.toUpperCase()} Inboxes ({filteredContacts.length})</span>
            <span className="text-[10px] text-purple-600 font-bold">Two-Way Ready</span>
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
                      isSelected ? "bg-purple-500/10 border-l-4 border-l-purple-500" : "hover:bg-muted/40"
                    )}
                  >
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="font-black text-foreground truncate max-w-[160px]">{c.name}</span>
                      <span className="rounded border px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                        {c.source}
                      </span>
                    </div>

                    <span className="text-[11px] text-muted-foreground truncate">{c.email}</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold truncate max-w-[200px]">
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

        {/* Right Pane: Thread Viewer & AI Auto-Filled Email Composer */}
        <div className="col-span-12 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm md:col-span-8">
          {selectedContact ? (
            <div className="flex h-full min-h-0 flex-col">
              {/* Header */}
              <div className="border-b border-border/60 bg-muted/20 p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-foreground">{selectedContact.name}</h3>
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-purple-600">
                      {selectedContact.sourceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    To: {selectedContact.email} {selectedContact.companyOrCollege ? `· ${selectedContact.companyOrCollege}` : ""}
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

              {/* Thread Flow */}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 bg-muted/5">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground space-y-2">
                    <Mail className="size-8 opacity-30" />
                    <p>No prior email messages in this thread with {selectedContact.name}.</p>
                    <p className="text-[11px]">Click "AI Draft Email" below to automatically populate the subject and email body based on company Knowledge Base.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOutbound = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-2xl border p-4 shadow-sm",
                          isOutbound ? "ml-6 border-purple-500/20 bg-purple-500/[0.03]" : "mr-6 border-border/60 bg-card"
                        )}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={cn("size-2 rounded-full", isOutbound ? "bg-purple-600" : "bg-blue-500")} />
                            <strong className="text-foreground">{m.senderName}</strong>
                            <span className="text-muted-foreground">&lt;{m.senderIdentifier}&gt;</span>
                          </div>
                          <span className="text-muted-foreground text-[11px]">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {m.subject && (
                          <p className="mt-1 font-bold text-xs text-foreground">
                            Subject: {m.subject}
                          </p>
                        )}

                        <div className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                          {m.body}
                        </div>

                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-3 border-t border-border/50 pt-2 flex flex-wrap gap-2">
                            {m.attachments.map((att) => (
                              <span key={att.id} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">
                                <Paperclip className="size-3 text-purple-600" />
                                <span>{att.filename}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dedicated Composer with AI Auto-Fill */}
              <div className="border-t border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Compose Email to {selectedContact.name}
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAiEmail}
                    disabled={isGeneratingAi}
                    className="gap-1.5 rounded-xl border-purple-500/30 text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  >
                    <Sparkles className="size-3" />
                    {isGeneratingAi ? "Formulating from Knowledge Base..." : "AI Draft Email"}
                  </Button>
                </div>

                {aiRationale && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20 px-3 py-1.5 text-[11px] text-purple-700 dark:text-purple-300">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span><strong>AI Auto-Filled:</strong> {aiRationale}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    value={subjectText}
                    onChange={(e) => setSubjectText(e.target.value)}
                    placeholder="Subject line..."
                    className="rounded-xl text-xs font-semibold"
                  />

                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Type email body or click 'AI Draft Email' to auto-populate from Knowledge Base..."
                    rows={5}
                    className="rounded-xl text-xs font-sans leading-relaxed"
                  />

                  {/* Attachments Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addSampleAttachment}
                        className="gap-1 rounded-lg text-xs h-7"
                      >
                        <Paperclip className="size-3" /> Attach Document
                      </Button>
                      {attachments.map((att) => (
                        <span key={att.id} className="rounded-lg bg-card border border-border/60 px-2 py-0.5 text-[11px] flex items-center gap-1">
                          <FileText className="size-3 text-primary" /> {att.filename}
                        </span>
                      ))}
                    </div>

                    <Button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={isSending || !emailBody.trim()}
                      className="gap-2 rounded-xl bg-purple-600 font-bold text-xs text-white hover:bg-purple-700 shadow"
                    >
                      <Send className="size-3.5" /> Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
              Select a contact to view and compose email.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
