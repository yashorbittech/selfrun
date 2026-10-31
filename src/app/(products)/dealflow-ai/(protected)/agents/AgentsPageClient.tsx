"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Volume2,
  Brain,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ElevenLabs voices that sound ultra-realistic and human
const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female", accent: "American", style: "Professional" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female", accent: "American", style: "Confident" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female", accent: "American", style: "Warm & Friendly" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male", accent: "American", style: "Professional" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", gender: "female", accent: "American", style: "Energetic" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", gender: "male", accent: "American", style: "Deep & Calm" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", gender: "male", accent: "American", style: "Authoritative" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male", accent: "American", style: "Narrative" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", gender: "male", accent: "American", style: "Conversational" },
  { id: "ThT5KcBeYPX3keUQqHPh", name: "Dorothy", gender: "female", accent: "British", style: "Formal" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", gender: "male", accent: "British", style: "Polished" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male", accent: "Australian", style: "Casual & Friendly" },
];

interface VoiceAgent {
  _id: string;
  name: string;
  role: string;
  personality: string;
  knowledgeBase: string;
  voiceId: string;
  voiceName: string;
  voiceGender: "male" | "female";
  avatarColor: string;
  avatarInitials: string;
  isActive: boolean;
  meetingCount: number;
  createdAt: string;
}

const ROLE_PRESETS = [
  "Sales Expert",
  "Technical Expert",
  "HR Specialist",
  "Product Specialist",
  "Customer Success Manager",
  "Account Manager",
  "Pricing Specialist",
  "Legal & Compliance",
];

const PERSONALITY_TEMPLATES: Record<string, string> = {
  "Sales Expert": `I am a senior sales professional with 8 years of experience closing B2B deals. 
I am confident, persuasive, and empathetic. I listen carefully to client concerns and provide 
tailored solutions. I am skilled at objection handling, value proposition articulation, and 
building rapport quickly. I speak with enthusiasm about our products and am always solution-focused.`,

  "Technical Expert": `I am a senior technical architect with deep expertise in software development, 
cloud infrastructure, and system integration. I explain complex technical concepts in simple terms 
for non-technical stakeholders. I am methodical, precise, and thorough. I back my statements with 
specific examples and data. I speak with quiet confidence about technical capabilities.`,

  "HR Specialist": `I am an HR professional specializing in talent acquisition and organizational development. 
I am warm, empathetic, and professional. I help candidates understand our company culture, growth 
opportunities, and benefits. I am transparent about processes and timelines. I create a comfortable 
environment for candidates to express themselves.`,

  "Pricing Specialist": `I am a pricing and commercial expert. I understand our pricing models deeply and 
can explain value clearly. I am data-driven and confident when discussing numbers. I can negotiate 
professionally while protecting company interests. I frame pricing in terms of ROI and value delivered.`,
};

export default function AgentsPageClient() {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);

  const emptyForm = {
    name: "",
    role: "",
    personality: "",
    knowledgeBase: "",
    voiceId: ELEVENLABS_VOICES[0].id,
    voiceName: ELEVENLABS_VOICES[0].name,
    voiceGender: "female" as "male" | "female",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dealflow-ai/voice-agents");
      const data = await res.json();
      if (data.ok) setAgents(data.agents);
    } catch {
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRolePreset = (role: string) => {
    setForm((f) => ({
      ...f,
      role,
      personality: PERSONALITY_TEMPLATES[role] ?? f.personality,
    }));
  };

  const handleVoiceSelect = (voiceId: string) => {
    const voice = ELEVENLABS_VOICES.find((v) => v.id === voiceId);
    if (voice) {
      setForm((f) => ({ ...f, voiceId: voice.id, voiceName: voice.name, voiceGender: voice.gender as "male" | "female" }));
    }
  };

  const previewVoice = async (voiceId: string, agentName: string) => {
    setPreviewVoiceId(voiceId);
    try {
      const sampleText = `Hi, I'm ${agentName || "your AI colleague"}. I'm here to help you with the meeting today. How can I assist you?`;
      const res = await fetch("/api/dealflow-ai/meetings/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleText, voiceId }),
      });
      if (!res.ok) {
        // Fallback to browser TTS for preview
        const utter = new SpeechSynthesisUtterance(sampleText);
        const voices = speechSynthesis.getVoices();
        const preferred = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ?? null;
        if (preferred) utter.voice = preferred;
        utter.rate = 0.92;
        speechSynthesis.speak(utter);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play();
    } catch {
      toast.error("Voice preview failed. Check ElevenLabs API key in .env.");
    } finally {
      setPreviewVoiceId(null);
    }
  };

  const saveAgent = async () => {
    if (!form.name.trim() || !form.role.trim() || !form.personality.trim() || !form.knowledgeBase.trim()) {
      toast.error("All fields are required");
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/dealflow-ai/voice-agents/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        toast.success(`${form.name} updated successfully`);
      } else {
        // Create new
        const res = await fetch("/api/dealflow-ai/voice-agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        toast.success(`${form.name} created successfully! They're ready to join meetings.`);
      }
      setForm(emptyForm);
      setShowCreateForm(false);
      setEditingId(null);
      loadAgents();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (agent: VoiceAgent) => {
    setForm({
      name: agent.name,
      role: agent.role,
      personality: agent.personality,
      knowledgeBase: agent.knowledgeBase,
      voiceId: agent.voiceId,
      voiceName: agent.voiceName,
      voiceGender: agent.voiceGender,
    });
    setEditingId(agent._id);
    setShowCreateForm(true);
  };

  const deleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Remove ${agentName} from your team? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/dealflow-ai/voice-agents/${agentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(`${agentName} removed`);
      loadAgents();
    } catch (err) {
      toast.error(String(err));
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setShowCreateForm(false);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bot className="w-7 h-7 text-violet-400" />
            AI Voice Agents
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create human-sounding AI teammates that join your client meetings and respond when called by name.
          </p>
        </div>
        <Button
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowCreateForm(true); }}
          className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-violet-950/40 border border-violet-800/50 rounded-xl p-4 text-sm text-violet-200">
        <p className="font-semibold mb-1">💡 How agents work in meetings</p>
        <ul className="space-y-1 text-violet-300 text-xs">
          <li>• Agents join as participants in your DealFlow AI meeting room</li>
          <li>• They stay completely silent until someone says their name</li>
          <li>• If the client or sales person says <span className="font-semibold text-white">&quot;Sarah, can you explain...&quot;</span> — Sarah responds instantly</li>
          <li>• They speak with ElevenLabs ultra-realistic voices — clients won&apos;t know they&apos;re AI</li>
          <li>• They respond based on their personality and knowledge base</li>
        </ul>
      </div>

      {/* Create / Edit Form */}
      {showCreateForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">
              {editingId ? "Edit Agent" : "Create New Agent"}
            </h2>
            <button onClick={cancelForm} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <User className="w-3.5 h-3.5 inline mr-1" />
                Agent Name <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g. Sarah, Rahul, Emma, James"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-xs text-zinc-500 mt-1">This is the name people say in the meeting to activate this agent.</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <Briefcase className="w-3.5 h-3.5 inline mr-1" />
                Role / Title <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g. Sales Expert, Technical Lead"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ROLE_PRESETS.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRolePreset(r)}
                    className="text-xs px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-zinc-300 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <Volume2 className="w-3.5 h-3.5 inline mr-1" />
                Voice (ElevenLabs) <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {ELEVENLABS_VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className={cn(
                      "flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all",
                      form.voiceId === voice.id
                        ? "border-violet-500 bg-violet-950/50 text-white"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600"
                    )}
                  >
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
                      voice.gender === "female" ? "bg-rose-700" : "bg-blue-700"
                    )}>
                      {voice.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{voice.name}</p>
                      <p className="text-xs text-zinc-500">{voice.accent} · {voice.style}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Preview Voice */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewVoice(form.voiceId, form.name)}
                disabled={!!previewVoiceId}
                className="mt-2 text-xs gap-1.5 border-zinc-700"
              >
                <Volume2 className="w-3.5 h-3.5" />
                {previewVoiceId ? "Playing preview..." : `Preview ${ELEVENLABS_VOICES.find(v => v.id === form.voiceId)?.name ?? ""} voice`}
              </Button>
            </div>

            {/* Personality */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <Brain className="w-3.5 h-3.5 inline mr-1" />
                Personality & Communication Style <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="Describe how this agent thinks, communicates, and behaves in meetings. Be specific about their speaking style, confidence level, how they handle objections, etc."
                value={form.personality}
                onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 min-h-28 text-sm"
              />
            </div>

            {/* Knowledge Base */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                <Brain className="w-3.5 h-3.5 inline mr-1" />
                Knowledge Base <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder={`What does this agent know deeply? Include:
- Your services / products and their details
- Pricing information
- Common client questions & answers  
- Technical specifications
- Company policies and processes
- Competitive advantages
The more detailed this is, the better the agent performs.`}
                value={form.knowledgeBase}
                onChange={(e) => setForm((f) => ({ ...f, knowledgeBase: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 min-h-40 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={saveAgent} disabled={isSaving} className="bg-violet-600 hover:bg-violet-500 gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : editingId ? "Update Agent" : "Create Agent"}
            </Button>
            <Button variant="outline" onClick={cancelForm} className="border-zinc-700">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Agents List */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Bot className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-400">No agents yet</h3>
          <p className="text-zinc-500 text-sm mt-1 mb-4">Create your first AI voice agent to use in meetings.</p>
          <Button onClick={() => setShowCreateForm(true)} className="bg-violet-600 hover:bg-violet-500 gap-2">
            <Plus className="w-4 h-4" />
            Create First Agent
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Agent Card Header */}
              <div className="flex items-center gap-4 p-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0", agent.avatarColor)}>
                  {agent.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <span className="text-xs bg-zinc-800 border border-zinc-700 rounded-full px-2 py-0.5 text-zinc-400">
                      {agent.role}
                    </span>
                    <span className={cn("text-xs rounded-full px-2 py-0.5", agent.isActive ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-zinc-800 text-zinc-500 border border-zinc-700")}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> {agent.voiceName} voice</span>
                    <span className="flex items-center gap-1"><PhoneCall className="w-3 h-3" /> {agent.meetingCount} meetings</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => previewVoice(agent.voiceId, agent.name)}
                    className="p-2 text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Preview voice"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(agent)}
                    className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Edit agent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAgent(agent._id, agent.name)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Remove agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === agent._id ? null : agent._id)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {expandedId === agent._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === agent._id && (
                <div className="border-t border-zinc-800 p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 mb-1.5">Personality</p>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-800 rounded-lg p-3 whitespace-pre-wrap">
                      {agent.personality}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 mb-1.5">Knowledge Base</p>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-800 rounded-lg p-3 whitespace-pre-wrap line-clamp-10">
                      {agent.knowledgeBase}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
