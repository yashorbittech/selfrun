import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/products/dealflow-ai/Breadcrumbs";
import ChatbotConfigForm from "@/components/products/dealflow-ai/ChatbotConfigForm";
import { getChatbotConfig, serializeChatbotConfig } from "@/lib/chatbot-config";
import { isOpenAIConfigured } from "@/lib/openai";

export default async function ChatbotConfigPage() {
  const config = serializeChatbotConfig(await getChatbotConfig());

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/dealflow-ai" },
          { label: "AI Chatbot", href: "/sitecraft-ai/chatbot" },
          { label: "AI Config" },
        ]}
        title={<>AI Configuration</>}
        description={<>Model, generation, retrieval, rate limiting, and the welcome experience. The OpenAI API key is read
          from the server environment only and is never shown or editable here.</>}
      />

      <ChatbotConfigForm config={config} openAiConfigured={(await isOpenAIConfigured())} />
    </div>
  );
}
