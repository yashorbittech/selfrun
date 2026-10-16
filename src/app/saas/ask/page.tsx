import type { Metadata } from "next";
import SaasAskContent from "./SaasAskContent";

export const metadata: Metadata = {
  title: "Ask AI | SelfRun AI",
  description:
    "Chat with the SelfRun AI assistant. Get instant answers about features, pricing, automation, and how SelfRun AI can work for your business.",
};

export default function SaasAskPage() {
  return <SaasAskContent />;
}
