import "server-only";
import { connectionValues } from "@/lib/platform/connections/resolve";

const API_BASE = "https://api.elevenlabs.io/v1";
const STT_MODEL = "scribe_v1";

/** The workspace's own ElevenLabs key (Workspace → Settings → Integrations). */
async function workspaceKey(): Promise<string | null> {
  return (await connectionValues("elevenlabs"))?.apiKey ?? null;
}

export async function isElevenLabsConfigured(): Promise<boolean> {
  return Boolean(await workspaceKey());
}

async function requireKey(): Promise<string> {
  const key = await workspaceKey();
  if (!key) throw new Error("ElevenLabs isn't connected for this workspace. Add your ElevenLabs API key in Workspace → Settings → Integrations.");
  return key;
}

// ---------------------------------------------------------------------------
// Speech-to-text (Scribe)
// ---------------------------------------------------------------------------

export interface TranscriptionResult {
  text: string;
  languageCode: string | null;
  languageProbability: number | null;
  audioDurationSecs: number | null;
  model: string;
}

export async function transcribeAudio(
  audio: Buffer,
  mimeType: string
): Promise<TranscriptionResult> {
  const form = new FormData();
  form.append("model_id", STT_MODEL);
  const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType || "audio/webm" }), `speech.${ext}`);

  const res = await fetch(`${API_BASE}/speech-to-text`, {
    method: "POST",
    headers: { "xi-api-key": await requireKey() },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs STT ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    text?: string;
    language_code?: string;
    language_probability?: number;
    audio_duration_secs?: number;
  };

  return {
    text: (data.text ?? "").trim(),
    languageCode: data.language_code ?? null,
    languageProbability: typeof data.language_probability === "number" ? data.language_probability : null,
    audioDurationSecs: typeof data.audio_duration_secs === "number" ? data.audio_duration_secs : null,
    model: STT_MODEL,
  };
}

// ---------------------------------------------------------------------------
// Streaming text-to-speech
// ---------------------------------------------------------------------------

export interface TtsSettings {
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
}

/** Opens a streaming TTS request and returns the raw audio/mpeg byte stream. */
export async function streamTts(text: string, cfg: TtsSettings): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(
    `${API_BASE}/text-to-speech/${encodeURIComponent(cfg.voiceId)}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": await requireKey(),
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: cfg.modelId,
        voice_settings: {
          stability: cfg.stability,
          similarity_boost: cfg.similarityBoost,
          style: cfg.style,
          use_speaker_boost: true,
          speed: cfg.speed,
        },
      }),
    }
  );

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.body as ReadableStream<Uint8Array>;
}

// ---------------------------------------------------------------------------
// Voice catalogue (admin config picker)
// ---------------------------------------------------------------------------

export interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  category: string | null;
  previewUrl: string | null;
  labels: Record<string, string>;
}

export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const res = await fetch(`${API_BASE}/voices`, {
    headers: { "xi-api-key": await requireKey() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs voices ${res.status}`);
  }
  const data = (await res.json()) as {
    voices?: Array<{
      voice_id: string;
      name: string;
      category?: string;
      preview_url?: string;
      labels?: Record<string, string>;
    }>;
  };
  return (data.voices ?? []).map((v) => ({
    voiceId: v.voice_id,
    name: v.name,
    category: v.category ?? null,
    previewUrl: v.preview_url ?? null,
    labels: v.labels ?? {},
  }));
}
