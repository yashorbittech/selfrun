"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  Briefcase,
  Users,
  Activity,
  Globe,
} from "lucide-react";
import GlassCard from "@/components/products/dealflow-ai/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntegrationStatus } from "@/lib/dealflow-ai/types";

export default function DealFlowIntegrationsClient({
  initialIntegrations,
}: {
  initialIntegrations: IntegrationStatus;
}) {
  const [status, setStatus] = useState<IntegrationStatus>(initialIntegrations);
  const [syncingMeta, setSyncingMeta] = useState(false);
  const [syncingUpwork, setSyncingUpwork] = useState(false);
  const [syncingWeb, setSyncingWeb] = useState(false);

  const handleSyncMeta = async () => {
    setSyncingMeta(true);
    try {
      const res = await fetch("/api/dealflow-ai/integrations/meta/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message);
        setStatus((prev) => ({ ...prev, meta: data.metaStatus }));
      } else {
        toast.error(data.error || "Meta sync failed.");
      }
    } catch {
      toast.error("Network error during Meta sync.");
    } finally {
      setSyncingMeta(false);
    }
  };

  const handleSyncUpwork = async () => {
    setSyncingUpwork(true);
    try {
      const res = await fetch("/api/dealflow-ai/integrations/upwork/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message);
        setStatus((prev) => ({ ...prev, upwork: data.upworkStatus }));
      } else {
        toast.error(data.error || "Upwork sync failed.");
      }
    } catch {
      toast.error("Network error during Upwork sync.");
    } finally {
      setSyncingUpwork(false);
    }
  };

  const handleSyncWebsite = async () => {
    setSyncingWeb(true);
    try {
      const res = await fetch("/api/dealflow-ai/integrations/careers/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message);
        setStatus((prev) => ({ ...prev, website: data.websiteStatus }));
      } else {
        toast.error(data.error || "Website sync failed.");
      }
    } catch {
      toast.error("Network error during Website application sync.");
    } finally {
      setSyncingWeb(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-brand-accent/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
              <Plug className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-black text-foreground">
                Centralized Acquisition Engine & Webhooks
              </h3>
              <p className="text-xs text-muted-foreground">
                Leads and Job Applications are continuously fetched into independent pipelines, triggering instant WhatsApp notifications and queuing AI responses for your review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> 4 of 4 Connectors Online
            </span>
          </div>
        </div>
      </div>

      {/* 4 Connectors Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Meta Lead Ads Integration */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 font-bold text-sm">
                META
              </span>
              <div>
                <h4 className="text-base font-black text-foreground">Meta Lead Ads Integration</h4>
                <p className="text-xs text-muted-foreground">Facebook & Instagram Instant Lead Forms</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
              Connected
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Connected Ad Accounts:</span>
              <strong className="text-foreground">{status.meta.connectedAccounts.join(", ")}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Forms Synced:</span>
              <strong className="text-foreground">{status.meta.activeFormsCount} Instant Forms</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Leads Fetched:</span>
              <strong className="text-foreground font-mono">{status.meta.totalLeadsFetched} leads</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Graph Sync:</span>
              <span className="text-muted-foreground font-mono">{new Date(status.meta.lastSyncedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            Automatically attributes campaign name, ad creative, form ID, and custom questions into DealFlow AI leads pipeline.
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSyncMeta}
              disabled={syncingMeta}
              className="w-full gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
            >
              <RefreshCw className={cn("size-3.5", syncingMeta && "animate-spin")} />
              {syncingMeta ? "Fetching Meta Leads..." : "Sync Meta Leads Now"}
            </Button>
          </div>
        </div>

        {/* 2. Upwork Integration */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                UPW
              </span>
              <div>
                <h4 className="text-base font-black text-foreground">Upwork API Integration</h4>
                <p className="text-xs text-muted-foreground">High-Value Project Leads & Talent Inquiries</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
              Active Stream
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Queries:</span>
              <strong className="text-foreground">{status.upwork.activeQueries.length} saved searches</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Opportunities Captured:</span>
              <strong className="text-foreground font-mono">{status.upwork.totalOpportunitiesFetched} projects</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Client Filters:</span>
              <strong className="text-foreground">Payment Verified, &gt;$10k Spend</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last API Pull:</span>
              <span className="text-muted-foreground font-mono">{new Date(status.upwork.lastSyncedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            Brings client specifications, budgets, country, and proposal workflows straight into DealFlow AI without needing Upwork open.
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSyncUpwork}
              disabled={syncingUpwork}
              className="w-full gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-md"
            >
              <RefreshCw className={cn("size-3.5", syncingUpwork && "animate-spin")} />
              {syncingUpwork ? "Scanning Upwork API..." : "Sync Upwork Opportunities Now"}
            </Button>
          </div>
        </div>

        {/* 3. Website Job Application Integration */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 font-bold text-sm">
                WEB
              </span>
              <div>
                <h4 className="text-base font-black text-foreground">Website Careers Portal</h4>
                <p className="text-xs text-muted-foreground">Direct Candidate Ingestion & Resume Storage</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
              Webhook Live
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Public Careers Portal:</span>
              <a href={status.website.portalUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                {status.website.portalUrl}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active Open Positions:</span>
              <strong className="text-foreground">{status.website.openJobPositions} Roles</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Applications Ingested:</span>
              <strong className="text-foreground font-mono">{status.website.totalApplicationsFetched} resumes</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Application:</span>
              <span className="text-muted-foreground font-mono">{new Date(status.website.lastApplicationReceivedAt).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            Captures candidate info, parses experience and skills, stores PDF resumes, and updates DealFlow AI automatically in real time.
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSyncWebsite}
              disabled={syncingWeb}
              className="w-full gap-2 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-700 shadow-md"
            >
              <RefreshCw className={cn("size-3.5", syncingWeb && "animate-spin")} />
              {syncingWeb ? "Ingesting Applications..." : "Simulate New Job Application"}
            </Button>
          </div>
        </div>

        {/* 4. WhatsApp Business API Gateway */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                WA
              </span>
              <div>
                <h4 className="text-base font-black text-foreground">WhatsApp Business API</h4>
                <p className="text-xs text-muted-foreground">Instant Alerts & Contextual AI Conversations</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
              Webhook Active
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registered Business Number:</span>
              <strong className="text-foreground">{status.whatsapp.businessPhoneNumber}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Automated Alerts Trigger:</span>
              <strong className="text-emerald-600 font-bold">Enabled (Leads & Candidates)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total WhatsApp Dispatches:</span>
              <strong className="text-foreground font-mono">{status.whatsapp.totalNotificationsSent} alerts</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Human Approval Layer:</span>
              <strong className="text-primary font-bold">Mandatory Prior to Send</strong>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            Distinguishes between "New Lead" vs "New Job Application" in every notification, with contact numbers and direct record links.
          </div>

          <div className="pt-2">
            <a
              href="/dealflow-ai/whatsapp"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/40 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              Open WhatsApp Hub & Notification Logs <ArrowRight className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
