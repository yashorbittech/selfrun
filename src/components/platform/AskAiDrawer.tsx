"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Bot,
  User,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { usePanelMeta, usePanels } from "@/components/platform/PanelsProvider";
import {
  PANELS_CONFIG,
  processPanelMessage,
  type AgenticFlowState,
  type MessageItem,
} from "@/lib/ai/panel-agentic-engine";

export interface AskAiDrawerProps {
  open: boolean;
  onClose: () => void;
  panelId: string;
  panelTitle: string;
  panelDescription: string;
  roles?: string[];
  permissionOverrides?: Record<string, boolean>;
}

export default function AskAiDrawer({
  open,
  onClose,
  panelId,
  panelTitle,
  panelDescription,
  roles,
}: AskAiDrawerProps) {
  const registry = usePanelMeta(panelId);
  const allPanels = usePanels();
  const panel = PANELS_CONFIG[panelId] || PANELS_CONFIG.pms;
  // Names come from the Panel Registry so the assistant, headers and listings all agree.
  const displayName = registry?.name ?? panel.name;
  const displayCode = registry?.shortName ?? panel.shortCode;
  const displayDescription = registry?.description ?? panelDescription;

  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [flowState, setFlowState] = useState<AgenticFlowState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const storageKey = `askai:chat:${panelId}`;
  const [restored, setRestored] = useState(false);

  // Restore this tab's conversation so it survives page changes and panel switches.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { messages?: MessageItem[]; flowState?: AgenticFlowState | null };
        if (saved.messages?.length) setMessages(saved.messages);
        if (saved.flowState) setFlowState(saved.flowState);
      }
    } catch {
      /* ignore unreadable storage */
    }
    setRestored(true);
    setMounted(true);
  }, [storageKey]);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ messages, flowState }));
    } catch {
      /* storage full or unavailable */
    }
  }, [restored, storageKey, messages, flowState]);

  // Initialize initial greeting when drawer opens
  useEffect(() => {
    if (open && restored && messages.length === 0) {
      setMessages([
        {
          id: "welcome-msg",
          sender: "assistant",
          text: `Hello! I am your context-aware **${displayName} (${displayCode}) AI Agent**.\n\nI can answer questions about panel data, handle automation, or guide you step-by-step through tasks like creating records, scheduling tasks, and managing workflows.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [open, restored, panel, messages.length]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, flowState]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputValue("");

    // Process via Panel Agentic Engine
    const { nextState, assistantMessages } = processPanelMessage(query, panelId, flowState, roles, { name: registry?.name, shortName: registry?.shortName, description: registry?.description, names: Object.fromEntries(Object.values(allPanels).map((p) => [p.key, p.name])) });

    setFlowState(nextState);
    setMessages((prev) => [...prev, ...assistantMessages]);
  };

  const handleConfirmAction = () => {
    handleSend("Confirm");
  };

  const handleCancelAction = () => {
    handleSend("Cancel");
  };

  const handleReset = () => {
    setFlowState(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: `Conversation reset. Ask me anything or trigger a multi-step workflow in **${displayName}**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Right-Side AI Chat Panel Drawer */}
          <motion.div
            key="ask-ai-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-y-0 right-0 z-[1000] flex h-full w-full flex-col border-l border-border/80 bg-background/95 shadow-2xl backdrop-blur-2xl sm:w-[440px]"
          >
            {/* Drawer Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-brand-accent text-white shadow-md shadow-primary/20">
                  <Sparkles className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-bold text-foreground">
                      {displayName}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      ⚡ {displayCode} Agent
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {displayDescription || panel.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleReset}
                  title="Reset Conversation"
                  aria-label="Reset Conversation"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Ask AI Panel"
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Agentic Multi-Step Workflow Progress Bar */}
            {flowState && !flowState.isCompleted && (
              <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs shrink-0">
                <div className="flex items-center justify-between font-medium text-primary mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 animate-pulse" />
                    Agentic Workflow: {flowState.actionLabel}
                  </span>
                  <span>
                    Step {Math.min(flowState.currentStepIndex + 1, flowState.fields.length)} of{" "}
                    {flowState.fields.length}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${
                        ((Math.min(flowState.currentStepIndex + 1, flowState.fields.length)) /
                          flowState.fields.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Conversation Messages Container */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "assistant" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot className="size-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/40 border border-border/50 text-foreground"
                    }`}
                  >
                    {/* Plain Text or Markdown rendering */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Step Info Badge */}
                    {msg.stepInfo && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <ArrowRight className="size-3" />
                        Step {msg.stepInfo.current} of {msg.stepInfo.total}: {msg.stepInfo.fieldName}
                      </div>
                    )}

                    {/* Warning Scope Notice */}
                    {msg.warningNotice && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-500">
                        <ShieldAlert className="size-3.5" />
                        {msg.warningNotice}
                      </div>
                    )}

                    {/* Confirmation Summary Card */}
                    {msg.confirmationCard && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-primary/30 bg-background/80 p-3 shadow-sm">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground mb-2">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          Review &amp; Confirm: {msg.confirmationCard.actionLabel}
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          {msg.confirmationCard.fields.map((f, i) => (
                            <div key={i} className="flex justify-between border-b border-border/40 py-1 last:border-0">
                              <span className="text-muted-foreground">{f.label}:</span>
                              <span className="font-semibold text-foreground">{f.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={handleConfirmAction}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                          >
                            Confirm &amp; Create
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelAction}
                            className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Success Action Card */}
                    {msg.successCard && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-4" />
                            {msg.successCard.title}
                          </div>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {msg.successCard.recordId}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] mb-2">
                          {msg.successCard.details.map((d, i) => (
                            <div key={i} className="flex justify-between text-muted-foreground">
                              <span>{d.label}:</span>
                              <span className="font-medium text-foreground">{d.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Status: {msg.successCard.status}
                        </div>
                      </div>
                    )}

                    <span className="mt-1 block text-right text-[10px] opacity-60">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === "user" && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Action Suggestion Chips */}
            {panel.quickPrompts.length > 0 && !flowState && (
              <div className="border-t border-border/40 bg-muted/10 px-4 py-2 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Suggested {displayCode} Actions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {panel.quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                    >
                      <Sparkles className="size-3 text-primary" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Composer Footer */}
            <div className="border-t border-border/60 bg-background p-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask ${displayCode} AI or request action...`}
                  className="flex-1 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
