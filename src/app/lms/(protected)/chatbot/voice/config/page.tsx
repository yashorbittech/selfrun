import PanelPageHeader from "@/components/platform/panel/PanelPageHeader";
import Breadcrumbs from "@/components/lms/Breadcrumbs";
import VoiceConfigForm from "@/components/lms/VoiceConfigForm";
import { getChatbotConfig } from "@/lib/chatbot-config";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import { getCompanyBrand } from "@/lib/platform/branding";

export default async function VoiceConfigPage() {
  const brand = await getCompanyBrand();
  const config = await getChatbotConfig();

  return (
    <div className="space-y-4">
      <PanelPageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/lms" },
          { label: "AI Chatbot", href: "/lms/chatbot" },
          { label: "Conversation AI", href: "/lms/chatbot/voice" },
          { label: "ElevenLabs Config" },
        ]}
        title={<>ElevenLabs Configuration</>}
        description={<>Voice, model and delivery settings for voice mode on the Ask {brand.name} page. The API key is read from
          the server environment only.</>}
      />

      <VoiceConfigForm voice={config.voice} elevenLabsConfigured={(await isElevenLabsConfigured())} />
    </div>
  );
}
