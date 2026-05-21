"use server";

import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type { WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

type WaveAActionResult =
  | { success: true; result: WaveAAnalysisResult }
  | { success: false; error: string };

export async function handleWaveAAnalysis(
  input: PerimeterParseInput,
): Promise<WaveAActionResult> {
  try {
    const result = await runWaveAAnalysis(input);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível processar a análise factual (Onda A).",
    };
  }
}
