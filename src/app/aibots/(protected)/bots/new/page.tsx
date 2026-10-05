import { redirect } from "next/navigation";
import { PageHeader, Notice } from "@/components/aibots/AibotsUi";
import BotForm from "@/components/aibots/BotForm";
import { getViewer, can } from "@/lib/aibots/viewer";
import { botFormOptions, formValuesFor } from "@/lib/aibots/form-options";
import { isOpenAIConfigured } from "@/lib/openai";

export default async function CreateBotPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/aibots/login");
  if (!can(viewer, "CREATE_BOT")) redirect("/aibots");
  const o = await botFormOptions();
  return (
    <div className="space-y-4">
      <PageHeader title="Create Bot" crumbs={[{ label: "Manage Bots", href: "/aibots/bots" }, { label: "Create Bot" }]} description="Configure the bot and, optionally, its own knowledge base. With files it answers only from them; without, from its instructions. It appears in the sidebar as soon as it's saved." />
      {!(await isOpenAIConfigured()) && <Notice tone="warn">OpenAI isn&apos;t connected for this workspace (Settings → Integrations) yet — you can create bots now, but they can&apos;t answer or index files until OPENAI_API_KEY is set.</Notice>}
      <BotForm
        botId={null}
        initial={formValuesFor(null, o.settings.defaultModel)}
        models={o.models}
        roleOptions={o.roleOptions}
        userOptions={o.userOptions}
        canUpload={can(viewer, "UPLOAD_FILES")}
        openAIReady={(await isOpenAIConfigured())}
      />
    </div>
  );
}
