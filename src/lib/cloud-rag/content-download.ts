import {
  getGraphAccessTokenForMode,
  getGraphAuthMode,
} from "@/lib/onedrive/graph";
import { getMaxFileBytes } from "@/lib/cloud-rag/config";

export async function downloadDriveItemContent(
  driveId: string,
  itemId: string,
): Promise<Buffer> {
  const mode = getGraphAuthMode();
  const token = await getGraphAccessTokenForMode(mode);
  const contentUrl =
    mode === "delegated"
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(itemId)}/content`
      : `https://graph.microsoft.com/v1.0/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`;

  const graphRes = await fetch(contentUrl, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "follow",
  });

  if (!graphRes.ok) {
    const text = await graphRes.text();
    throw new Error(
      `Falha ao baixar ficheiro (${graphRes.status}): ${text.slice(0, 200)}`,
    );
  }

  const arrayBuffer = await graphRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const maxBytes = getMaxFileBytes();
  if (buffer.length > maxBytes) {
    throw new Error(
      `Ficheiro excede limite de ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }
  return buffer;
}
