"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat, type PreChatFieldMode } from "@/components/chat/ChatProvider";
import { CATEGORIES } from "@/lib/categories";
import { useText } from "@/components/cms/TextContext";

const TEXT_FIELD_META = (tx: (key: string) => string): { key: "name" | "email" | "phone"; label: string; type: string; placeholder: string }[] => ([
  { key: "name", label: tx("chat.preChatForm.name"), type: "text", placeholder: tx("chat.preChatForm.jane-doe") },
  { key: "email", label: tx("chat.preChatForm.email"), type: "email", placeholder: tx("chat.preChatForm.jane-company-com") },
  { key: "phone", label: tx("chat.preChatForm.phone"), type: "tel", placeholder: "+91 98765 43210" },
]);

export function PreChatForm({ wide = false }: { wide?: boolean }) {
  const tx = useText();
  const { config, identify } = useChat();
  const preChat = config?.preChat;
  const [values, setValues] = React.useState({ name: "", email: "", phone: "", service: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  if (!preChat) return null;

  const visibleTextFields = TEXT_FIELD_META(tx).filter((f) => preChat.fields[f.key] !== "off");
  const showService = preChat.fields.service !== "off";

  function set(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // Light client-side check; the server is authoritative.
    const localErrors: Record<string, string> = {};
    for (const f of visibleTextFields) {
      const mode = preChat!.fields[f.key] as PreChatFieldMode;
      if (mode === "required" && !values[f.key].trim()) localErrors[f.key] = `${f.label} is required.`;
    }
    if (showService && preChat!.fields.service === "required" && !values.service) {
      localErrors.service = "Choose the service you're interested in.";
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      localErrors.email = "Enter a valid email address.";
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    const res = await identify(values);
    setSubmitting(false);
    if (!res.ok) setErrors(res.fieldErrors ?? { email: "Something went wrong. Please try again." });
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "w-full rounded-2xl border-2 border-border bg-background p-5 shadow-xl shadow-black/5 sm:p-6",
          wide ? "max-w-md" : "max-w-full"
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-accent text-white shadow-sm">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{preChat.title}</h3>
            {preChat.description && (
              <p className="text-xs leading-snug text-muted-foreground">{preChat.description}</p>
            )}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {visibleTextFields.map((f) => {
            const required = preChat.fields[f.key] === "required";
            return (
              <div key={f.key} className="flex flex-col gap-1">
                <label htmlFor={`prechat-${f.key}`} className="text-xs font-medium text-foreground">
                  {f.label}
                  {required && <span className="ml-0.5 text-primary">*</span>}
                </label>
                <input
                  id={`prechat-${f.key}`}
                  type={f.type}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.key, e.target.value)}
                  aria-invalid={Boolean(errors[f.key])}
                  className={cn(
                    "h-10 rounded-lg border bg-background px-3 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:ring-3 focus-visible:ring-primary/15",
                    errors[f.key] ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-primary/50"
                  )}
                />
                {errors[f.key] && <p className="text-[11px] text-destructive">{errors[f.key]}</p>}
              </div>
            );
          })}

          {showService && (
            <div className="flex flex-col gap-1">
              <label htmlFor="prechat-service" className="text-xs font-medium text-foreground">
                {tx("chat.preChatForm.main-service")}{preChat.fields.service === "required" && <span className="ml-0.5 text-primary">*</span>}
              </label>
              <select
                id="prechat-service"
                value={values.service}
                onChange={(e) => set("service", e.target.value)}
                aria-invalid={Boolean(errors.service)}
                className={cn(
                  "h-10 rounded-lg border bg-background px-3 text-[15px] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-primary/15",
                  values.service ? "text-foreground" : "text-muted-foreground/60",
                  errors.service ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-primary/50"
                )}
              >
                <option value="" disabled>
                  {tx("chat.preChatForm.what-are-you-interested-in")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug} className="text-foreground">
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.service && <p className="text-[11px] text-destructive">{errors.service}</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-brand-accent px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-all hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
            {tx("chat.preChatForm.start-chat")}</button>

          {preChat.consentText && (
            <p className="flex items-start gap-1.5 pt-1 text-[10px] leading-tight text-muted-foreground/70">
              <ShieldCheck className="mt-px size-3 flex-none" />
              {preChat.consentText}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
