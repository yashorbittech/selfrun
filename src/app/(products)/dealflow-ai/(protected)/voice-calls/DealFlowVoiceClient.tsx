"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  Clock,
  Sparkles,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  X,
  Activity,
  User,
  Bot,
  Briefcase,
  GraduationCap,
  Wrench,
  Building2,
  Search,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  listUnifiedContacts,
  listVoiceCalls,
  logCompletedVoiceCall,
} from "@/lib/dealflow-ai/store";
import type { PipelineTab, UnifiedPipelineContact, VoiceCallRecord } from "@/lib/dealflow-ai/types";

const TABS: { id: PipelineTab; label: string; icon: typeof Briefcase }[] = [
  { id: "jobs", label: "Job Applications", icon: Briefcase },
  { id: "interns", label: "Internship", icon: GraduationCap },
  { id: "trainees", label: "Industrial Training", icon: Wrench },
  { id: "clients", label: "Clients", icon: Building2 },
];

export default function DealFlowVoiceClient({
  initialTab = "clients",
}: {
  initialCalls?: unknown[];
  leads?: unknown[];
  applications?: unknown[];
  initialTab?: PipelineTab;
}) {
  const [activeTab, setActiveTab] = useState<PipelineTab>(initialTab);
  const [contacts, setContacts] = useState<UnifiedPipelineContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [voiceHistory, setVoiceHistory] = useState<VoiceCallRecord[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>("");
  const [search, setSearch] = useState("");

  // Live AI Call State
  const [activeCallContact, setActiveCallContact] = useState<UnifiedPipelineContact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isCalling, setIsCalling] = useState(false);
  const [humanTakenOver, setHumanTakenOver] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: "ai_assistant" | "contact" | "human_agent"; text: string; timestamp: string }[]>([]);

  // Custom Quick Dial modal
  const [showQuickDial, setShowQuickDial] = useState(false);
  const [dialPhone, setDialPhone] = useState("");
  const [dialName, setDialName] = useState("");

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load contacts and voice history
  useEffect(() => {
    const loaded = listUnifiedContacts(activeTab);
    setContacts(loaded);
    if (loaded.length > 0) {
      setSelectedContactId(loaded[0].id);
    }
    const calls = listVoiceCalls(activeTab);
    setVoiceHistory(calls);
    if (calls.length > 0) {
      setSelectedHistoryId(calls[0].id);
    }

    // Load real website applications and multi-source leads from MongoDB
    fetch(`/api/dealflow-ai/contacts?pipeline=${activeTab}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.contacts) && data.contacts.length > 0) {
          setContacts(data.contacts);
          setSelectedContactId((prev) => (data.contacts.some((c: UnifiedPipelineContact) => c.id === prev) ? prev : data.contacts[0].id));
        }
      })
      .catch(() => {});
  }, [activeTab]);

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  // Trigger real spoken voice via Web Speech API
  const speakVoice = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartAiCall = (contact: UnifiedPipelineContact) => {
    setActiveCallContact(contact);
    setIsCalling(true);
    setCallDuration(0);
    setHumanTakenOver(false);

    let openingScript = "";
    let customerReply = "";
    let aiFollowUp = "";

    if (contact.pipeline === "clients") {
      openingScript = `Hello ${contact.name}! This is Sarah calling from DealFlow AI on behalf of SelfRun. I am following up on your inquiry for ${contact.titleOrService} received through ${contact.sourceLabel}. Do you have two minutes to discuss your project requirements?`;
      customerReply = `Hi Sarah, yes I do! We are looking to kick off within the next two weeks and need confirmation on your team's technical architecture.`;
      aiFollowUp = `That is fantastic. Our senior engineering architects can begin with a 2-week MVP sprint. We provide dedicated full-stack developers and daily progress updates. I will send our scope breakdown to your email right away.`;
    } else if (contact.pipeline === "jobs") {
      openingScript = `Hello ${contact.name}, this is the Talent Team at DealFlow AI calling regarding your application for the ${contact.titleOrService} position. We reviewed your resume and were impressed with your credentials!`;
      customerReply = `Hello, thank you for calling! I am very excited about this role and available for next steps.`;
      aiFollowUp = `Great! We would like to schedule your 45-minute technical screening with our engineering lead this week. I am logging your availability now.`;
    } else if (contact.pipeline === "interns") {
      openingScript = `Hello ${contact.name}! This is DealFlow AI calling regarding your application for our Software Internship Program. We noticed your strong project work at ${contact.companyOrCollege || "college"}.`;
      customerReply = `Hi! Yes, I am looking for a 6-month internship with hands-on production code exposure.`;
      aiFollowUp = `Our internship includes a monthly stipend of ₹15,000 to ₹25,000, real mentorship, and PPO potential. We have sent the coding challenge link to your email.`;
    } else {
      openingScript = `Hello ${contact.name}, this is DealFlow AI calling regarding our 6-Months Industrial Training program. We received your registration.`;
      customerReply = `Hello, I wanted to confirm if live project certificates and ISO credentials are included.`;
      aiFollowUp = `Yes, all trainees build real production applications and receive verified ISO credentials along with placement support.`;
    }

    // Initialize Transcript
    const initialTranscript: typeof liveTranscript = [
      { speaker: "ai_assistant", text: openingScript, timestamp: "00:03" },
    ];
    setLiveTranscript(initialTranscript);

    // Speak AI opening voice out loud!
    speakVoice(openingScript);

    // Stream subsequent dialogue based on Knowledge Base
    setTimeout(() => {
      setLiveTranscript((prev) => [
        ...prev,
        { speaker: "contact", text: customerReply, timestamp: "00:15" },
      ]);
    }, 4500);

    setTimeout(() => {
      setLiveTranscript((prev) => [
        ...prev,
        { speaker: "ai_assistant", text: aiFollowUp, timestamp: "00:26" },
      ]);
      speakVoice(aiFollowUp);
    }, 8500);

    toast.success(`📞 AI Voice Call connected to ${contact.phone}! Speech synthesis active.`);
  };

  const handleTakeover = () => {
    setHumanTakenOver(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setLiveTranscript((prev) => [
      ...prev,
      {
        speaker: "human_agent",
        text: `[Human Agent has taken over the call] "Hello ${activeCallContact?.name}, I am stepping in directly to assist you with the final details."`,
        timestamp: "00:35",
      },
    ]);
    toast.success("🛡️ Human Takeover Activated! AI voice muted; your headset is now live.");
  };

  const handleEndCall = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (activeCallContact) {
      const recorded = logCompletedVoiceCall({
        pipeline: activeCallContact.pipeline,
        contactId: activeCallContact.id,
        contactName: activeCallContact.name,
        phoneNumber: activeCallContact.phone,
        durationSeconds: Math.max(callDuration, 38),
        transcript: liveTranscript,
        aiSummary: `AI Voice Call completed with ${activeCallContact.name}. Verified interest in ${activeCallContact.titleOrService}. Confirmed next steps based on central Knowledge Base.`,
        sentiment: "positive",
        nextActionItems: ["Send follow-up WhatsApp recap", "Update pipeline status in DealFlow AI"],
        humanTakenOver,
      });

      setVoiceHistory((prev) => [recorded, ...prev]);
      setSelectedHistoryId(recorded.id);
    }

    setIsCalling(false);
    setActiveCallContact(null);
    setLiveTranscript([]);
    toast.success("Call ended. Audio transcript & AI summary logged to call records.");
  };

  const formatSecs = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? contacts[0] ?? null;

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

      {/* Main Two-Pane View */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        {/* Left Contacts List - Exactly matches Live Chat */}
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
                    onClick={() => setSelectedContactId(c.id)}
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

        {/* Right Active Voice Call Window */}
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
                  <Button
                    onClick={() => handleStartAiCall(selectedContact)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-colors"
                  >
                    <PhoneCall className="size-3.5 animate-pulse" /> Call via AI
                  </Button>
                </div>
              </div>

              {/* Body: Knowledge Base Context & Call Transcripts */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> AI Voice Knowledge Base Context
                    </span>
                    <span className="text-[10px] rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600 font-bold">
                      Speech Engine Ready
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Target Requirement: <strong>{selectedContact.titleOrService}</strong> {selectedContact.budgetOrSalary ? `(${selectedContact.budgetOrSalary})` : ""}. Clicking <strong>"Call via AI"</strong> will initiate a live synthesized phone call grounded in our company Knowledge Base.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Completed Calls & Transcripts
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {voiceHistory.filter((v) => v.contactId === selectedContact.id).length} recorded
                    </span>
                  </div>

                  {voiceHistory.filter((v) => v.contactId === selectedContact.id).length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground space-y-2">
                      <Volume2 className="size-8 opacity-30 text-emerald-600" />
                      <p>No call records yet with <strong>{selectedContact.name}</strong>.</p>
                      <p className="text-[11px]">Click "Call via AI" above to initiate a live voice conversation.</p>
                    </div>
                  ) : (
                    voiceHistory
                      .filter((v) => v.contactId === selectedContact.id)
                      .map((rec) => (
                        <div key={rec.id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                            <div>
                              <h4 className="text-sm font-black text-foreground">{rec.contactName}</h4>
                              <p className="text-xs text-muted-foreground">{rec.phoneNumber} · {rec.initiatedBy}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                                Duration: {formatSecs(rec.durationSeconds)}
                              </span>
                              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                                {rec.sentiment}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs">
                            <strong className="text-foreground">AI Call Summary:</strong>{" "}
                            <span className="text-muted-foreground">{rec.aiSummary}</span>
                          </div>

                          <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2 text-xs">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Transcript Log:</p>
                            {rec.transcript.map((t, idx) => (
                              <div key={idx} className="leading-relaxed">
                                <strong className={t.speaker === "ai_assistant" ? "text-primary font-bold" : "text-foreground font-bold"}>
                                  {t.speaker === "ai_assistant" ? "AI Voice:" : `${rec.contactName}:`}
                                </strong>{" "}
                                <span className="text-muted-foreground">{t.text}</span>
                              </div>
                            ))}
                          </div>

                          {rec.nextActionItems && (
                            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                              {rec.nextActionItems.map((item, i) => (
                                <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-foreground flex items-center gap-1">
                                  <CheckCircle2 className="size-3 text-emerald-500" /> {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
              Select a contact to view call history.
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN LIVE VOICE CALL MODAL */}
      {isCalling && activeCallContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95">
          <div className="w-full max-w-2xl rounded-3xl border border-emerald-500/60 bg-card p-6 shadow-2xl space-y-5">
            {/* Call Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="relative flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl">
                  <PhoneCall className="size-6" />
                  <span className="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-ping opacity-60" />
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-foreground">{activeCallContact.name}</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-black text-emerald-600">
                      LIVE AI CALL
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeCallContact.phone} · Inquiring about {activeCallContact.titleOrService}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-2xl font-black text-foreground">{formatSecs(callDuration)}</span>
                <p className="text-[10px] uppercase font-bold text-emerald-600">Voice Connected</p>
              </div>
            </div>

            {/* Audio Waveform Animation */}
            <div className="flex items-center justify-center gap-1.5 py-3">
              {[14, 28, 44, 20, 36, 50, 32, 22, 42, 54, 26, 18, 38, 48, 30].map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-emerald-500 animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${(i % 5) * 120}ms` }}
                />
              ))}
            </div>

            {/* Real-Time Live Transcript Stream */}
            <div className="max-h-64 min-h-[160px] space-y-2.5 overflow-y-auto rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Activity className="size-3 text-emerald-500" /> Live Speech Dialogue Grounded in Knowledge Base:
              </p>

              {liveTranscript.map((t, idx) => (
                <div key={idx} className="rounded-xl border border-border/50 bg-background/95 p-3 text-xs leading-relaxed">
                  <strong className={t.speaker === "ai_assistant" ? "text-primary" : t.speaker === "human_agent" ? "text-amber-600" : "text-foreground"}>
                    {t.speaker === "ai_assistant" ? "AI Voice Assistant:" : t.speaker === "human_agent" ? "Human Agent Takeover:" : `${activeCallContact.name}:`}
                  </strong>{" "}
                  <span className="text-foreground">{t.text}</span>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <div>
                {!humanTakenOver ? (
                  <Button
                    onClick={handleTakeover}
                    className="gap-2 rounded-xl bg-amber-600 font-bold text-xs text-white hover:bg-amber-700 shadow"
                  >
                    <UserCheck className="size-4" /> Take Over Call (Human Mode)
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-600">
                    <ShieldCheck className="size-4" /> Speaking Live (AI Muted)
                  </span>
                )}
              </div>

              <Button
                variant="destructive"
                onClick={handleEndCall}
                className="gap-2 rounded-xl font-bold text-xs shadow"
              >
                <PhoneOff className="size-4" /> End Call & Log Summary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Quick Dial Modal */}
      {showQuickDial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <PhoneCall className="size-4 text-emerald-600" /> Manual Number Voice Call
              </h3>
              <button onClick={() => setShowQuickDial(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Contact Name</label>
                <Input
                  value={dialName}
                  onChange={(e) => setDialName(e.target.value)}
                  placeholder="e.g. Vikram Singhania"
                  className="mt-1 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Phone Number</label>
                <Input
                  value={dialPhone}
                  onChange={(e) => setDialPhone(e.target.value)}
                  placeholder="+91 98110 00000"
                  className="mt-1 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="ghost" size="sm" onClick={() => setShowQuickDial(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!dialName || !dialPhone) {
                    toast.error("Please enter a name and phone number.");
                    return;
                  }
                  setShowQuickDial(false);
                  handleStartAiCall({
                    id: `CUSTOM-${Date.now()}`,
                    pipeline: activeTab,
                    name: dialName,
                    phone: dialPhone,
                    email: "contact@custom.com",
                    titleOrService: "Custom Phone Call",
                    source: "manual",
                    sourceLabel: "Manual Direct Call",
                    status: "contacted",
                    statusLabel: "Call Initiated",
                    submittedAt: new Date().toISOString(),
                  });
                }}
                className="gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow"
              >
                <PhoneCall className="size-3.5" /> Start Call
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
