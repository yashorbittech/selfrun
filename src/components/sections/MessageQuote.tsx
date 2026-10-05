"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

interface MessageQuoteProps {
  eyebrow: string;
  message: ReactNode;
  name: string;
  role: ReactNode;
  initials: string;
  color: string;
  tone?: "default" | "muted";
}

export default function MessageQuote({ eyebrow, message, name, role, initials, color, tone = "default" }: MessageQuoteProps) {
  return (
    <section className={`py-24 sm:py-32 relative overflow-hidden ${tone === "muted" ? "bg-muted/10" : "bg-background"}`}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-secondary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="mx-auto max-w-4xl px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-[2.5rem] bg-muted/20 border border-border/50 shadow-xl p-8 sm:p-14 relative"
        >
          <Quote className="w-16 h-16 text-primary/10 absolute top-8 right-8" />
          <span className="text-sm font-semibold tracking-widest uppercase text-primary mb-6 block">{eyebrow}</span>
          <p className="text-xl sm:text-2xl font-medium text-foreground leading-relaxed mb-10 relative z-10">
            &ldquo;{message}&rdquo;
          </p>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
              {initials}
            </div>
            <div>
              <div className="font-bold text-foreground">{name}</div>
              <div className="text-sm text-muted-foreground">{role}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
