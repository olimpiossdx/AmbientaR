"use server";

import { generateGeoAnalysisComplement } from "@/ai/flows/geo-analysis-complement-flow";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { getLightTaskProvider } from "@/lib/ai-provider-status";
import type { AiProviderId } from "@/lib/ai-provider-labels";

type ComplementActionResult =
  | { success: true; result: GeoAnalysisComplementOutput; provider: AiProviderId }
  | { success: false; error: string };

export async function handleGeoAnalysisComplement(params: {
  geoAnalysisId: string;
  waveResult: WaveAAnalysisResult;
}): Promise<ComplementActionResult> {
  try {
    const result = await generateGeoAnalysisComplement(params);
    const provider = getLightTaskProvider() ?? "gemini";
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
