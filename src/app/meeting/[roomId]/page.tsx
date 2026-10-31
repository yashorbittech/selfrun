import ClientJoinClient from "./ClientJoinClient";

export const dynamic = "force-dynamic";

export default async function ClientJoinPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <ClientJoinClient roomId={roomId} />;
}
