"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  LocalParticipant,
  RemoteParticipant,
  Participant,
  ConnectionState,
} from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Bot,
  Activity,
  Copy,
  CheckCircle2,
  Volume2,
  VolumeX,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentInfo {
  _id: string;
  name: string;
  role: string;
  avatarColor: string;
  avatarInitials: string;
  voiceId: string;
  personality: string;
  knowledgeBase: string;
}

interface MeetingData {
  roomId: string;
  title: string;
  clientName: string;
  clientEmail: string;
  status: string;
  agentIds: string[];
  agentNames: string[];
  salesPersonName: string;
  clientJoinLink: string;
  notes: string;
}

type ParticipantMode = "sales" | "client";

interface AgentSessionState {
  agentId: string;
  agentName: string;
  isActive: boolean;         // Currently speaking / responding
  isSilent: boolean;         // Listening silently (default state)
  lastActivatedBy?: string;  // Who called this agent's name
  activatedAt?: number;
}

// ─── Transcript line ────────────────────────────────────────────────────────
interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  isAgent: boolean;
  timestamp: number;
}

// ─── Web Speech API types ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition?: any;
  }
}

export default function MeetingRoomClient({
  meeting,
  agents,
  participantMode,
  participantName,
}: {
  meeting: MeetingData;
  agents: AgentInfo[];
  participantMode: ParticipantMode;
  participantName: string;
}) {
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentSessionState[]>(
    agents.map((a) => ({
      agentId: a._id,
      agentName: a.name,
      isActive: false,
      isSilent: true,
    }))
  );
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeVideoEl, setActiveVideoEl] = useState<HTMLVideoElement | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<AnySpeechRecognition | null>(null);
  const agentSpeakingRef = useRef(false);

  // Scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // ── Connect to LiveKit room ─────────────────────────────────────────────
  useEffect(() => {
    const connect = async () => {
      try {
        const res = await fetch(`/api/dealflow-ai/meetings/${meeting.roomId}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantName,
            participantType: participantMode,
          }),
        });
        const data = await res.json();
        if (!data.ok) { toast.error("Failed to get meeting token"); return; }

        await room.connect(data.url, data.token);
        setLocalParticipant(room.localParticipant);
        setConnectionState(ConnectionState.Connected);

        // Publish mic track
        await room.localParticipant.setMicrophoneEnabled(true);

        // Update meeting status to live
        await fetch(`/api/dealflow-ai/meetings/${meeting.roomId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "live" }),
        });

        // Greet with agent info via data channel
        room.localParticipant.publishData(
          new TextEncoder().encode(JSON.stringify({
            type: "agent_roster",
            agents: agents.map((a) => ({ id: a._id, name: a.name, role: a.role })),
          })),
          { reliable: true }
        );

      } catch (err) {
        console.error("Room connect error:", err);
        toast.error("Failed to connect to meeting room. Check LiveKit credentials.");
        setConnectionState(ConnectionState.Disconnected);
      }
    };

    connect();

    // Room event listeners
    room.on(RoomEvent.ConnectionStateChanged, setConnectionState);
    room.on(RoomEvent.ParticipantConnected, () => setParticipants([...room.remoteParticipants.values()]));
    room.on(RoomEvent.ParticipantDisconnected, () => setParticipants([...room.remoteParticipants.values()]));

    return () => {
      room.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle mic ─────────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    try {
      const nextState = !isMicOn;
      await localParticipant.setMicrophoneEnabled(nextState);
      setIsMicOn(nextState);
    } catch (err) {
      console.error("Failed to toggle mic:", err);
    }
  }, [localParticipant, isMicOn]);

  // ── Toggle camera ───────────────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    try {
      const nextState = !isCameraOn;
      await localParticipant.setCameraEnabled(nextState);
      setIsCameraOn(nextState);
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  }, [localParticipant, isCameraOn]);

  // ── Speech Recognition — detect agent names in speech ─────────────────
  const startSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported in this browser. Use Chrome."); return; }

    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = async (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const text = lastResult[0].transcript.toLowerCase().trim();
      if (!lastResult.isFinal) return;

      // Add to transcript
      const line: TranscriptLine = {
        id: Date.now().toString(),
        speaker: participantName,
        text: lastResult[0].transcript,
        isAgent: false,
        timestamp: Date.now(),
      };
      setTranscript((prev) => [...prev, line]);

      if (agentSpeakingRef.current) return; // Don't trigger while agent is speaking

      // Check if any agent name was mentioned
      for (const agent of agents) {
        const agentNameLower = agent.name.toLowerCase();
        if (text.includes(agentNameLower)) {
          // This agent was called by name!
          await triggerAgentResponse(agent, lastResult[0].transcript, participantMode === "sales" ? "sales" : "client");
          break;
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.warn("Speech recognition error:", e.error);
      }
    };

    recog.onend = () => {
      // Restart continuously
      if (isRecognizing) {
        try { recog.start(); } catch { /* ignore */ }
      }
    };

    recog.start();
    recognitionRef.current = recog;
    setIsRecognizing(true);
    toast.success("🎤 Name detection active — say an agent's name to activate them");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, participantMode, participantName, isRecognizing]);

  const stopSpeechRecognition = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecognizing(false);
  }, []);

  // ── Trigger AI agent to speak ──────────────────────────────────────────
  const triggerAgentResponse = useCallback(async (
    agent: AgentInfo,
    triggerText: string,
    calledBy: "sales" | "client"
  ) => {
    if (agentSpeakingRef.current) return; // Only one agent at a time
    agentSpeakingRef.current = true;

    // Mark agent as active in UI
    setAgentStates((prev) =>
      prev.map((s) =>
        s.agentId === agent._id
          ? { ...s, isActive: true, isSilent: false, lastActivatedBy: calledBy, activatedAt: Date.now() }
          : s
      )
    );

    try {
      // Build conversation context from transcript
      const context = transcript.slice(-10).map((t) => `${t.speaker}: ${t.text}`).join("\n");

      // 1. Generate text response via OpenAI
      const genRes = await fetch("/api/dealflow-ai/meetings/agent-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agent.name,
          agentRole: agent.role,
          personality: agent.personality,
          knowledgeBase: agent.knowledgeBase,
          triggerText,
          calledBy,
          conversationContext: context,
          clientName: meeting.clientName,
          salesPersonName: meeting.salesPersonName,
        }),
      });
      const genData = await genRes.json();
      if (!genData.ok) throw new Error(genData.error ?? "AI generation failed");

      const responseText: string = genData.response;

      // Add to transcript
      setTranscript((prev) => [
        ...prev,
        { id: Date.now().toString(), speaker: agent.name, text: responseText, isAgent: true, timestamp: Date.now() },
      ]);

      // 2. Convert to ultra-realistic voice via ElevenLabs and play
      if (agent.voiceId && process.env.NEXT_PUBLIC_ELEVENLABS_KEY) {
        await speakWithElevenLabs(responseText, agent.voiceId);
      } else {
        // Fallback to browser TTS
        await speakWithBrowserTTS(responseText, agent.name);
      }
    } catch (err) {
      console.error("Agent response error:", err);
      toast.error(`${agent.name} failed to respond`);
    } finally {
      agentSpeakingRef.current = false;
      setAgentStates((prev) =>
        prev.map((s) =>
          s.agentId === agent._id ? { ...s, isActive: false, isSilent: true } : s
        )
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, meeting]);

  // ── ElevenLabs TTS ─────────────────────────────────────────────────────
  const speakWithElevenLabs = async (text: string, voiceId: string) => {
    const res = await fetch(`/api/dealflow-ai/meetings/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
    });
    if (!res.ok) throw new Error("TTS failed");
    const audioBlob = await res.blob();
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = reject;
      audio.play();
    });
  };

  // ── Browser TTS fallback ────────────────────────────────────────────────
  const speakWithBrowserTTS = (text: string, agentName: string): Promise<void> => {
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      // Pick a good voice — prefer high quality en-US voices
      const preferred = voices.find((v) =>
        v.name.includes("Google") || v.name.includes("Premium") || v.name.includes("Natural")
      ) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
      if (preferred) utter.voice = preferred;
      utter.rate = 0.92;
      utter.pitch = agentName.charCodeAt(0) % 2 === 0 ? 0.95 : 1.05;
      utter.volume = 1;
      utter.onend = () => resolve();
      speechSynthesis.speak(utter);
    });
  };

  // ── Leave meeting ───────────────────────────────────────────────────────
  const leaveMeeting = async () => {
    stopSpeechRecognition();
    speechSynthesis.cancel();
    await room.disconnect();
    await fetch(`/api/dealflow-ai/meetings/${meeting.roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended", transcript: transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n") }),
    });
    window.location.href = participantMode === "sales" ? "/dealflow-ai/meetings" : "/";
  };

  // ── Copy client link ────────────────────────────────────────────────────
  const copyClientLink = () => {
    navigator.clipboard.writeText(meeting.clientJoinLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isConnected = connectionState === ConnectionState.Connected;

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* ─── Left: Main Video/Audio Area ─── */}
      <div className="flex-1 flex flex-col">

        {/* Meeting Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900">
          <div>
            <h1 className="font-semibold text-sm text-white truncate max-w-80">{meeting.title}</h1>
            <p className="text-xs text-zinc-400">
              {isConnected ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live · {participants.length + 1} participant{participants.length !== 0 ? "s" : ""}
                </span>
              ) : "Connecting..."}
            </p>
          </div>

          {/* Client join link */}
          {participantMode === "sales" && (
            <button
              onClick={copyClientLink}
              className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied!" : "Copy client link"}
            </button>
          )}
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-2 gap-3 auto-rows-fr">
          {/* Local — Sales Person or Client */}
          <div className="relative bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800">
            {isCameraOn && activeVideoEl ? (
              <video ref={(el) => { if (el) setActiveVideoEl(el); }} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold">
                  {participantName.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm text-zinc-300">{participantName}</span>
                <span className="text-xs text-zinc-500 capitalize">{participantMode}</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
              {isMicOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
              <span className="text-xs">{participantName}</span>
            </div>
          </div>

          {/* Remote participants */}
          {participants.map((p) => (
            <RemoteParticipantTile key={p.identity} participant={p as RemoteParticipant} />
          ))}

          {/* AI Agents — shown as participants */}
          {agentStates.map((state) => {
            const agentInfo = agents.find((a) => a._id === state.agentId);
            if (!agentInfo) return null;
            return (
              <AgentParticipantTile
                key={state.agentId}
                agent={agentInfo}
                state={state}
                onManualTrigger={() => triggerAgentResponse(agentInfo, `${agentInfo.name}, please introduce yourself`, "sales")}
              />
            );
          })}
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-center gap-4 py-4 border-t border-zinc-800 bg-zinc-900">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMic}
            className={cn("w-12 h-12 rounded-full", isMicOn ? "bg-zinc-700 hover:bg-zinc-600" : "bg-red-600 hover:bg-red-500")}
            title={isMicOn ? "Mute mic" : "Unmute mic"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            className={cn("w-12 h-12 rounded-full", isCameraOn ? "bg-zinc-700 hover:bg-zinc-600" : "bg-zinc-800 hover:bg-zinc-700")}
            title="Toggle camera"
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={isMuted ? () => setIsMuted(false) : () => setIsMuted(true)}
            className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700"
            title="Toggle speaker"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {/* Name detection toggle — only for sales (they trigger agents) */}
          {participantMode === "sales" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecognizing ? stopSpeechRecognition : startSpeechRecognition}
              className={cn("w-12 h-12 rounded-full", isRecognizing ? "bg-violet-600 hover:bg-violet-500 animate-pulse" : "bg-zinc-800 hover:bg-zinc-700")}
              title={isRecognizing ? "Name detection active" : "Start agent name detection"}
            >
              <Activity className="w-5 h-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={leaveMeeting}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500"
            title="Leave meeting"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ─── Right: Agents Panel + Transcript ─── */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col">

        {/* Agents List */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">AI Agents in Room</span>
          </div>
          <div className="space-y-2">
            {agentStates.length === 0 && (
              <p className="text-xs text-zinc-500">No agents assigned to this meeting.</p>
            )}
            {agentStates.map((state) => {
              const info = agents.find((a) => a._id === state.agentId);
              if (!info) return null;
              return (
                <div
                  key={state.agentId}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-all",
                    state.isActive ? "bg-violet-950 border border-violet-700" : "bg-zinc-800 border border-zinc-700"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0", info.avatarColor)}>
                    {info.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{info.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{info.role}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {state.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-violet-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping inline-block" />
                        Speaking
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Silent</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {participantMode === "sales" && (
            <div className="mt-3 p-2 bg-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-400 leading-relaxed">
                💡 Say an agent&apos;s name aloud and they&apos;ll respond. Enable
                <span className="text-violet-400 font-medium"> Name Detection </span>
                (the pulse icon) to activate.
              </p>
            </div>
          )}
        </div>

        {/* Live Transcript */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Live Transcript</span>
          </div>
          <div
            ref={transcriptRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 text-xs"
          >
            {transcript.length === 0 && (
              <p className="text-zinc-500 text-center mt-8">Transcript will appear here as people speak...</p>
            )}
            {transcript.map((line) => (
              <div key={line.id} className={cn("rounded-lg p-2", line.isAgent ? "bg-violet-950/50 border border-violet-900/50" : "bg-zinc-800/50")}>
                <span className={cn("font-semibold", line.isAgent ? "text-violet-300" : "text-zinc-300")}>
                  {line.speaker}:
                </span>
                <span className="text-zinc-300 ml-1">{line.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Participants count footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
          <Users className="w-3.5 h-3.5" />
          {participants.length + 1 + agentStates.length} in room
          ({agentStates.length} AI agent{agentStates.length !== 1 ? "s" : ""})
        </div>
      </div>
    </div>
  );
}

// ─── Remote Participant Tile ───────────────────────────────────────────────
function RemoteParticipantTile({ participant }: { participant: RemoteParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    participant.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
      }
    });
    // Attach already-subscribed video tracks
    for (const pub of participant.getTrackPublications().values()) {
      if (pub.isSubscribed && pub.track?.kind === Track.Kind.Video && videoRef.current) {
        pub.track.attach(videoRef.current);
      }
    }
  }, [participant]);

  return (
    <div className="relative bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
          {(participant.name ?? participant.identity).slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm text-zinc-300 mt-2">{participant.name ?? participant.identity}</span>
      </div>
      <div className="absolute bottom-3 left-3 bg-black/60 rounded-full px-2 py-1 text-xs">
        {participant.name ?? participant.identity}
      </div>
    </div>
  );
}

// ─── AI Agent Participant Tile ─────────────────────────────────────────────
function AgentParticipantTile({
  agent,
  state,
  onManualTrigger,
}: {
  agent: AgentInfo;
  state: AgentSessionState;
  onManualTrigger: () => void;
}) {
  return (
    <div
      className={cn(
        "relative bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-300",
        state.isActive ? "border-violet-500 shadow-lg shadow-violet-900/30" : "border-zinc-800"
      )}
    >
      {/* Animated background for active state */}
      {state.isActive && (
        <div className="absolute inset-0 bg-violet-950/20 animate-pulse" />
      )}

      <div className="relative flex flex-col items-center gap-3">
        {/* Avatar with speaking ring */}
        <div className={cn("relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold", agent.avatarColor)}>
          {state.isActive && (
            <span className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping opacity-60" />
          )}
          {agent.avatarInitials}
        </div>

        <div className="text-center">
          <p className="font-semibold text-white text-sm">{agent.name}</p>
          <p className="text-xs text-zinc-400">{agent.role}</p>
        </div>

        {/* Status */}
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-3 py-1 rounded-full",
          state.isActive ? "bg-violet-700/50 text-violet-200" : "bg-zinc-800 text-zinc-400"
        )}>
          <Bot className="w-3 h-3" />
          {state.isActive ? "Speaking..." : "Listening silently"}
        </div>

        {/* Manual trigger button */}
        <button
          onClick={onManualTrigger}
          className="text-xs text-zinc-500 hover:text-violet-400 transition-colors"
        >
          Activate {agent.name}
        </button>
      </div>

      {/* AI Badge */}
      <div className="absolute top-3 right-3 bg-violet-700/80 rounded-full px-2 py-0.5 text-xs font-medium">
        AI
      </div>
    </div>
  );
}
