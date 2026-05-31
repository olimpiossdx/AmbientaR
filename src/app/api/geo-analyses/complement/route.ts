import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import { generateGeoComplementWithProvider } from "@/lib/geospatial/generate-geo-complement";
import {
  assertGeminiGeoComplementAllowed,
  recordGeminiGeoComplement,
} from "@/lib/geospatial/geo-ia-gemini-quota";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

type BodyShape = {
  geoAnalysisId?: string;
  waveResult?: WaveAAnalysisResult;
  provider?: AiProviderId;
};

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedApi(req);
    const uid = user.uid || user.id;
    const body = (await req.json()) as BodyShape;

    if (!body.geoAnalysisId || !body.waveResult) {
      return NextResponse.json(
        { error: "geoAnalysisId e waveResult são obrigatórios." },
        { status: 400 },
      );
    }

    const provider: AiProviderId =
      body.provider === "deepseek" ? "deepseek" : "gemini";

    if (provider === "gemini") {
      await assertGeminiGeoComplementAllowed(uid);
    }

    const result = await generateGeoComplementWithProvider({
      geoAnalysisId: body.geoAnalysisId,
      waveResult: body.waveResult,
      provider,
    });

    if (provider === "gemini") {
      await recordGeminiGeoComplement(uid);
    }

    return NextResponse.json({ success: true, result, provider });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao gerar complemento.";
    const status = /limite mensal/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
