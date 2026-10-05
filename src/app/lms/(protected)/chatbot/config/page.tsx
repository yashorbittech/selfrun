import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import ChatbotConfigForm from "@/components/lms/ChatbotConfigForm";
import { getChatbotConfig, serializeChatbotConfig } from "@/lib/chatbot-config";
import { isOpenAIConfigured } from "@/lib/openai";

export default async function ChatbotConfigPage() {
  const config = serializeChatbotConfig(await getChatbotConfig());

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/lms" },
          { label: "AI Chatbot", href: "/lms/chatbot" },
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
