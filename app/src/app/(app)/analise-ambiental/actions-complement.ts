"use server";

import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import { generateGeoComplementWithProvider } from "@/lib/geospatial/generate-geo-complement";
import {
  assertGeminiGeoComplementAllowed,
  recordGeminiGeoComplement,
} from "@/lib/geospatial/geo-ia-gemini-quota";
import { verifyIdTokenAndLoadUser } from "@/lib/package-enforcement-server";

type ComplementActionResult =
  | { success: true; result: GeoAnalysisComplementOutput; provider: AiProviderId }
  | { success: false; error: string };

export async function handleGeoAnalysisComplement(params: {
  geoAnalysisId: string;
  waveResult: WaveAAnalysisResult;
  provider?: AiProviderId;
  idToken?: string | null;
}): Promise<ComplementActionResult> {
  try {
    const provider: AiProviderId =
      params.provider === "deepseek" ? "deepseek" : "gemini";

    if (provider === "gemini" && params.idToken) {
      const user = await verifyIdTokenAndLoadUser(params.idToken);
      await assertGeminiGeoComplementAllowed(user.uid || user.id);
      const result = await generateGeoComplementWithProvider({
        geoAnalysisId: params.geoAnalysisId,
        waveResult: params.waveResult,
        provider,
      });
      await recordGeminiGeoComplement(user.uid || user.id);
      return { success: true, result, provider };
    }

    const result = await generateGeoComplementWithProvider({
      geoAnalysisId: params.geoAnalysisId,
      waveResult: params.waveResult,
      provider,
    });
    return { success: true, result, provider };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o complemento com IA.",
    };
  }
}
