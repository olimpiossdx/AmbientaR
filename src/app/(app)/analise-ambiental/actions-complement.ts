"use server";

import { generateGeoAnalysisComplement } from "@/ai/flows/geo-analysis-complement-flow";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";

type ComplementActionResult =
  | { success: true; result: GeoAnalysisComplementOutput }
  | { success: false; error: string };

export async function handleGeoAnalysisComplement(params: {
  geoAnalysisId: string;
  waveResult: WaveAAnalysisResult;
}): Promise<ComplementActionResult> {
  try {
    const result = await generateGeoAnalysisComplement(params);
    return { success: true, result };
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
