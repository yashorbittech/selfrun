"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MessageSquare,
  Mail,
  Radio,
  PhoneCall,
  Briefcase,
  GraduationCap,
  Wrench,
  Building2,
  Plug,
  RefreshCw,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntegrationStatus } from "@/lib/dealflow-ai/types";

export default function OmnichannelCommandCenter({
  integrations,
  jobsCount = 3,
  internsCount = 2,
  traineesCount = 2,
  clientsCount = 5,
}: {
  pendingApprovalsCount?: number;
  integrations: IntegrationStatus;
  jobsCount?: number;
  internsCount?: number;
  traineesCount?: number;
  clientsCount?: number;
  leadsTotal?: number;
  applicantsTotal?: number;
}) {
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [syncingUpwork, setSyncingUpwork] = useState(false);

  const handleSyncMeta = async () => {
    setSyncingMeta(true);
    try {
      const res = await fetch("/api/dealflow-ai/integrations/meta/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) toast.success(data.message);
    } catch {
      toast.error("Failed to sync Meta.");
    } finally {
      setSyncingMeta(false);
    }
  };

  const handleSyncUpwork = async () => {
    setSyncingUpwork(true);
    try {
      const res = await fetch("/api/dealflow-ai/integrations/upwork/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) toast.success(data.message);
    } catch {
      toast.error("Failed to sync Upwork.");
    } finally {
      setSyncingUpwork(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 4 Dedicated AI Communication Channels Hub */}
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Four Dedicated AI Communication Channels
            </h3>
            <p className="text-xs text-muted-foreground">
              Direct, unified communication with Jobs, Interns, Trainees, and Clients — AI replies auto-fill right inside your composer!
            </p>
          </div>

          <Link
            href="/dealflow-ai/knowledge-base"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <BookOpen className="size-3.5" /> Central Knowledge Base
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. AI Chat */}
          <Link
            href="/dealflow-ai/messages"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <MessageSquare className="size-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Channel 1
                </span>
              </div>
              <h4 className="mt-3 text-sm font-black text-foreground group-hover:text-primary transition-colors">
                AI Live Chat
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                4-tab chat manager for Jobs, Interns, Trainees & Clients with auto-filling AI replies.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs font-bold text-primary">
              <span>Open Live Chat</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 2. AI Email */}
          <Link
            href="/dealflow-ai/emails"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-purple-500/40 hover:bg-purple-500/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                  <Mail className="size-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Channel 2
                </span>
              </div>
              <h4 className="mt-3 text-sm font-black text-foreground group-hover:text-purple-600 transition-colors">
                Dedicated Email
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Two-way client with attachments & threading; AI auto-populates subject and body.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs font-bold text-purple-600">
              <span>Open Email Client</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 3. AI WhatsApp */}
          <Link
            href="/dealflow-ai/whatsapp"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Radio className="size-4" />
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600">
                  WhatsApp API
                </span>
              </div>
              <h4 className="mt-3 text-sm font-black text-foreground group-hover:text-emerald-600 transition-colors">
                WhatsApp Hub
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Automated alerts on incoming submissions and instant Knowledge-Base AI replies.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs font-bold text-emerald-600">
              <span>Open WhatsApp Hub</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 4. AI Voice Calls */}
          <Link
            href="/dealflow-ai/voice-calls"
            className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-amber-500/[0.04]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <PhoneCall className="size-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Channel 4
                </span>
              </div>
              <h4 className="mt-3 text-sm font-black text-foreground group-hover:text-amber-600 transition-colors">
                AI Voice Calls
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                1-click "Call via AI" CTA with real speech audio dialogue, live transcripts, and human takeover.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs font-bold text-amber-600">
              <span>Dialer & Voice Center</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* 4 Pipeline Categories Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Jobs Pipeline */}
        <Link
          href="/dealflow-ai/pipeline/jobs"
          className="group flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase className="size-5" />
              </span>
              <span className="text-xl font-black text-foreground">{jobsCount}</span>
            </div>
            <h4 className="mt-3 text-base font-black text-foreground group-hover:text-primary transition-colors">
              Jobs Pipeline
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Candidate resumes, portfolios, and technical interview stages.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
            View Jobs Pipeline <ArrowRight className="size-3.5" />
          </span>
        </Link>

        {/* 2. Interns Pipeline */}
        <Link
          href="/dealflow-ai/pipeline/interns"
          className="group flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                <GraduationCap className="size-5" />
              </span>
              <span className="text-xl font-black text-foreground">{internsCount}</span>
            </div>
            <h4 className="mt-3 text-base font-black text-foreground group-hover:text-primary transition-colors">
              Interns Pipeline
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              College applicants, technical assessments, stipends, and PPO conversions.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
            View Interns Pipeline <ArrowRight className="size-3.5" />
          </span>
        </Link>

        {/* 3. Trainees Pipeline */}
        <Link
          href="/dealflow-ai/pipeline/trainees"
          className="group flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Wrench className="size-5" />
              </span>
              <span className="text-xl font-black text-foreground">{traineesCount}</span>
            </div>
            <h4 className="mt-3 text-base font-black text-foreground group-hover:text-primary transition-colors">
              Trainees Pipeline
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              6-Weeks / 6-Months industrial training, college NOCs, and ISO projects.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
            View Trainees Pipeline <ArrowRight className="size-3.5" />
          </span>
        </Link>

        {/* 4. Clients Pipeline (Meta, FB, IG, Upwork, Website) */}
        <Link
          href="/dealflow-ai/pipeline/clients"
          className="group flex flex-col justify-between rounded-3xl border border-blue-500/30 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Building2 className="size-5" />
              </span>
              <span className="text-xl font-black text-blue-600">{clientsCount}</span>
            </div>
            <h4 className="mt-3 text-base font-black text-foreground group-hover:text-blue-600 transition-colors">
              Clients Pipeline
            </h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Facebook Ads, Instagram Ads, Upwork, and Website inquiries.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
            View Clients Pipeline <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
