import { NextResponse } from "next/server";
import {
  assertCloudRagGraphReady,
  isCloudRagEnabled,
} from "@/lib/cloud-rag/deploy-flags";
import { isMicrosoftGraphConfigured } from "@/lib/onedrive/deploy-flags";

export function cloudRagDisabledResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Biblioteca IA na nuvem desativada. Defina ONEDRIVE_RAG_ENABLED=true no .env.local.",
    },
    { status: 503 },
  );
}

export function cloudRagNotConfiguredResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Microsoft Graph não configurado. Verifique MICROSOFT_GRAPH_* no .env.local.",
    },
    { status: 503 },
  );
}

export function assertCloudRagReady():
  | { ok: true }
  | { ok: false; response: NextResponse } {
  if (!isCloudRagEnabled()) {
    return { ok: false, response: cloudRagDisabledResponse() };
  }
  if (!isMicrosoftGraphConfigured()) {
    return { ok: false, response: cloudRagNotConfiguredResponse() };
  }
  if (!assertCloudRagGraphReady()) {
    return { ok: false, response: cloudRagNotConfiguredResponse() };
  }
  return { ok: true };
}
