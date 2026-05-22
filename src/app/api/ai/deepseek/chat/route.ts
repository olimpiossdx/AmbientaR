import { NextRequest, NextResponse } from "next/server";
import { isAiRoutesEnabled } from "@/lib/deploy-flags";
import { getDeepseekApiKey } from "@/lib/deepseek-env";
import {
  deepseekChatCompletion,
  type DeepseekChatInput,
} from "@/lib/deepseek-chat-server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  if (!isAiRoutesEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Rotas de IA desativadas (ENABLE_AI_ROUTES). Ative em `.env.local` e reinicie o servidor.",
      },
      { status: 503 },
    );
  }

  const apiKey = getDeepseekApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "DEEPSEEK_API_KEY não definida. Configure em `.env.local` e reinicie `npm run dev`.",
      },
      { status: 503 },
    );
  }

  try {
    await requireAuthenticatedApi(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  let body: DeepseekChatInput;
  try {
    body = (await request.json()) as DeepseekChatInput;
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido no corpo do pedido." },
      { status: 400 },
    );
  }

  const result = await deepseekChatCompletion(body, apiKey);

  if (!result.ok) {
    const status = result.httpStatus === 400 ? 400 : 502;
    return NextResponse.json(
      { success: false, error: result.error, status: result.httpStatus },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    tipo: result.tipo,
    model: result.model,
    reply: result.reply,
  });
}
