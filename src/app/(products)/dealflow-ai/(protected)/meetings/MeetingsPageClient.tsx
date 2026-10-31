"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  X,
  Save,
  Bot,
  Video,
  Clock,
  User,
  Mail,
  Phone,
  Building2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Trash2,
  PlayCircle,
  CheckCheck,
  AlarmClock,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface VoiceAgent {
  _id: string;
  name: string;
  role: string;
  avatarColor: string;
  avatarInitials: string;
  voiceName: string;
  isActive: boolean;
}

interface Meeting {
  _id: string;
  roomId: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  agentNames: string[];
  agentIds: string[];
  salesPersonName: string;
  notes: string;
  clientJoinLink: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Scheduled", color: "text-blue-400", bg: "bg-blue-950 border-blue-800" },
  live: { label: "● Live Now", color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-800" },
  ended: { label: "Ended", color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-950 border-red-900" },
};

export default function MeetingsPageClient() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "scheduled" | "live" | "ended">("all");

  const emptyForm = {
    title: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
    scheduledAt: "",
    durationMinutes: 30,
    agentIds: [] as string[],
    salesPersonName: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([loadMeetings(), loadAgents()]);
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dealflow-ai/meetings");
      const data = await res.json();
      if (data.ok) setMeetings(data.meetings);
    } catch { toast.error("Failed to load meetings"); }
    finally { setIsLoading(false); }
  };

  const loadAgents = async () => {
    try {
      const res = await fetch("/api/dealflow-ai/voice-agents");
      const data = await res.json();
      if (data.ok) setAgents(data.agents.filter((a: VoiceAgent) => a.isActive));
    } catch { /* silent */ }
  };

  const toggleAgent = (agentId: string) => {
    setForm((f) => ({
      ...f,
      agentIds: f.agentIds.includes(agentId)
        ? f.agentIds.filter((id) => id !== agentId)
        : [...f.agentIds, agentId],
    }));
  };

  const saveMeeting = async () => {
    if (!form.title.trim() || !form.clientName.trim() || !form.clientEmail.trim() || !form.scheduledAt) {
      toast.error("Title, client name, client email, and scheduled date are required");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/dealflow-ai/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(`Meeting scheduled! Share the client link to invite ${form.clientName}.`);
      setForm(emptyForm);
      setShowCreateForm(false);
      loadMeetings();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = (meeting: Meeting) => {
    navigator.clipboard.writeText(meeting.clientJoinLink);
    setCopiedId(meeting.roomId);
    setTimeout(() => setCopiedId(null), 2500);
    toast.success("Client join link copied!");
  };

  const deleteMeeting = async (roomId: string, title: string) => {
    if (!confirm(`Cancel meeting "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/dealflow-ai/meetings/${roomId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success("Meeting removed");
      loadMeetings();
    } catch (err) { toast.error(String(err)); }
  };

  const filteredMeetings = meetings.filter((m) => activeFilter === "all" || m.status === activeFilter);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Video className="w-7 h-7 text-blue-400" />
            Meetings
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Schedule pre-sale video meetings with AI agents attending as your team members.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dealflow-ai/agents">
            <Button variant="outline" className="border-zinc-700 gap-2 text-sm">
              <Bot className="w-4 h-4 text-violet-400" />
              Manage Agents
            </Button>
          </Link>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "scheduled", "live", "ended"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize",
              activeFilter === f
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"
            )}
          >
            {f === "all" ? `All (${meetings.length})` : f === "live" ? `● Live (${meetings.filter(m => m.status === "live").length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${meetings.filter(m => m.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Schedule New Meeting</h2>
            <button onClick={() => { setForm(emptyForm); setShowCreateForm(false); }}>
              <X className="w-5 h-5 text-zinc-400 hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Title */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Meeting Title *</label>
              <Input
                placeholder="e.g. Discovery Call — TechCorp, Proposal Presentation — Rahul"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Client Info */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><User className="w-3.5 h-3.5 inline mr-1" />Client Name *</label>
              <Input placeholder="Rahul Sharma" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><Mail className="w-3.5 h-3.5 inline mr-1" />Client Email *</label>
              <Input placeholder="rahul@company.com" value={form.clientEmail} onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><Phone className="w-3.5 h-3.5 inline mr-1" />Client Phone</label>
              <Input placeholder="+91 98765 43210" value={form.clientPhone} onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><Building2 className="w-3.5 h-3.5 inline mr-1" />Client Company</label>
              <Input placeholder="TechCorp Pvt. Ltd." value={form.clientCompany} onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1" />Date & Time *</label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><Clock className="w-3.5 h-3.5 inline mr-1" />Duration (minutes)</label>
              <Input
                type="number"
                min={15}
                max={180}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) || 30 }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Sales Person */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><User className="w-3.5 h-3.5 inline mr-1" />Sales Person Name</label>
              <Input placeholder="Your name (shown to client)" value={form.salesPersonName} onChange={(e) => setForm((f) => ({ ...f, salesPersonName: e.target.value }))} className="bg-zinc-800 border-zinc-700" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5"><FileText className="w-3.5 h-3.5 inline mr-1" />Meeting Notes / Agenda</label>
              <Textarea placeholder="Topics to cover, client background, key objectives..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700 min-h-16 text-sm" />
            </div>

            {/* Agent Selection */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                <Bot className="w-3.5 h-3.5 inline mr-1" />
                Select AI Agents to Join This Meeting
              </label>
              {agents.length === 0 ? (
                <div className="bg-zinc-800 rounded-xl p-4 text-sm text-zinc-400 flex items-center gap-3">
                  <Bot className="w-5 h-5 text-zinc-500" />
                  No active agents found.
                  <Link href="/dealflow-ai/agents" className="text-violet-400 hover:underline">Create agents first →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {agents.map((agent) => (
                    <button
                      key={agent._id}
                      onClick={() => toggleAgent(agent._id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        form.agentIds.includes(agent._id)
                          ? "border-violet-500 bg-violet-950/40 text-white"
                          : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0", agent.avatarColor)}>
                        {agent.avatarInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-zinc-400 truncate">{agent.role}</p>
                      </div>
                      {form.agentIds.includes(agent._id) && (
                        <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={saveMeeting} disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Scheduling..." : "Schedule Meeting"}
            </Button>
            <Button variant="outline" onClick={() => { setForm(emptyForm); setShowCreateForm(false); }} className="border-zinc-700">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Loading meetings...</div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Video className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-400">No meetings yet</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-4">Schedule your first AI-powered pre-sale meeting.</p>
          <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-500 gap-2">
            <Plus className="w-4 h-4" /> Schedule Meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => {
            const statusCfg = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.scheduled;
            return (
              <div key={meeting.roomId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex items-start gap-4">
                  {/* Date Block */}
                  <div className="flex-shrink-0 w-14 text-center bg-zinc-800 border border-zinc-700 rounded-xl p-2">
                    <p className="text-xs text-zinc-400">
                      {new Date(meeting.scheduledAt).toLocaleDateString("en-IN", { month: "short" })}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {new Date(meeting.scheduledAt).getDate()}
                    </p>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">{meeting.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{meeting.clientName}</span>
                          {meeting.clientCompany && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{meeting.clientCompany}</span>}
                          <span className="flex items-center gap-1"><AlarmClock className="w-3 h-3" />{formatDate(meeting.scheduledAt)} · {meeting.durationMinutes}m</span>
                        </div>
                        {meeting.agentNames.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Bot className="w-3.5 h-3.5 text-violet-400" />
                            <div className="flex gap-1.5">
                              {meeting.agentNames.map((name) => (
                                <span key={name} className="text-xs bg-violet-950/60 text-violet-300 border border-violet-800/50 rounded-full px-2 py-0.5">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {meeting.salesPersonName && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                            <Users className="w-3 h-3" /> Sales: {meeting.salesPersonName}
                          </div>
                        )}
                      </div>
                      <span className={cn("text-xs px-2.5 py-1 rounded-full border flex-shrink-0", statusCfg.bg, statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {/* Join as Sales Person */}
                      <Link href={`/dealflow-ai/meetings/${meeting.roomId}?mode=sales&name=${encodeURIComponent(meeting.salesPersonName || "Sales")}`}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500 gap-1.5 text-xs h-8">
                          <PlayCircle className="w-3.5 h-3.5" />
                          Join as Sales
                        </Button>
                      </Link>

                      {/* Copy client link */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLink(meeting)}
                        className="border-zinc-700 gap-1.5 text-xs h-8"
                      >
                        {copiedId === meeting.roomId
                          ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Copied!</>
                          : <><Copy className="w-3.5 h-3.5" /> Copy client link</>}
                      </Button>

                      {/* Open client link */}
                      <a href={meeting.clientJoinLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-zinc-700 gap-1.5 text-xs h-8">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Client view
                        </Button>
                      </a>

                      {/* Mark ended */}
                      {meeting.status === "live" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await fetch(`/api/dealflow-ai/meetings/${meeting.roomId}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "ended" }),
                            });
                            loadMeetings();
                          }}
                          className="border-zinc-700 text-xs h-8"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> End Meeting
                        </Button>
                      )}

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMeeting(meeting.roomId, meeting.title)}
                        className="text-zinc-500 hover:text-red-400 h-8 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
