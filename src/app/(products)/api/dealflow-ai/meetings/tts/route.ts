import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/dealflow-ai/meetings/tts
 * Converts text to ultra-realistic speech using ElevenLabs API.
 * Returns audio/mpeg binary stream.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();

    if (!text || !voiceId) {
      return NextResponse.json({ ok: false, error: "text and voiceId are required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "ElevenLabs API key not configured" }, { status: 503 });
    }

    // ElevenLabs Text-to-Speech API — using Turbo v2.5 for ultra-low latency
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",  // Lowest latency, best for real-time
          voice_settings: {
            stability: 0.45,         // Slight variation = more human-like
            similarity_boost: 0.82,  // High fidelity to selected voice
            style: 0.30,             // Natural expressiveness
            use_speaker_boost: true, // Higher clarity in calls
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[tts] ElevenLabs error:", errorText);
      return NextResponse.json({ ok: false, error: "ElevenLabs TTS failed" }, { status: 500 });
    }

    // Stream the audio back directly
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("[tts] POST error:", err);
    return NextResponse.json({ ok: false, error: "TTS request failed" }, { status: 500 });
  }
}
