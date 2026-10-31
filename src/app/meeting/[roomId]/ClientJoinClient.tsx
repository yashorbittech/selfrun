"use client";

import { useState } from "react";
import { Video, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function ClientJoinClient({
  roomId,
}: {
  roomId: string;
}) {
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleJoin = () => {
    if (!name.trim()) return;
    setIsJoining(true);
    // Redirect to the actual meeting room in client mode
    router.push(`/dealflow-ai/meetings/${roomId}?mode=client&name=${encodeURIComponent(name.trim())}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-600/20 border border-blue-600/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Video className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-1">You&apos;re invited to a meeting</h1>
        <p className="text-sm text-zinc-400 mb-6">Enter your name to join the video call.</p>

        <div className="relative mb-4">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="pl-9 bg-zinc-800 border-zinc-700 text-center"
            autoFocus
          />
        </div>

        <Button
          onClick={handleJoin}
          disabled={!name.trim() || isJoining}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white"
        >
          {isJoining ? "Joining..." : "Join Meeting"}
        </Button>

        <p className="text-xs text-zinc-600 mt-4">
          No account needed. Your browser will ask for microphone access.
        </p>
      </div>
    </div>
  );
}
