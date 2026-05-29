"use server";

import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas";
import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import {
  queryCarsInPerimeter,
  SICAR_WFS_BASE_URL,
} from "@/lib/geospatial/sicar-car-service";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type {
  GeoInfluenceAreaConfig,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";

type WaveAActionResult =
  | { success: true; result: WaveAAnalysisResult }
  | { success: false; error: string };

export async function handleWaveAAnalysis(
  input: PerimeterParseInput,
  influenceConfig: GeoInfluenceAreaConfig = DEFAULT_INFLUENCE_CONFIG,
): Promise<WaveAActionResult> {
  try {
    const result = await runWaveAAnalysis(input, influenceConfig);

    if (input.dataType !== "car") {
      try {
        const carQuery = await queryCarsInPerimeter(input);
        if (carQuery.imoveis.length > 0) {
          result.factualSummary = `CAR/SICAR: ${carQuery.resumo}\n\n${result.factualSummary}`;
          result.fontesConsultadas = [
            {
              nome: "SICAR GeoServer (consulta pública)",
              url: SICAR_WFS_BASE_URL,
              tipo: "ogc" as const,
            },
            ...result.fontesConsultadas,
          ];
        }
      } catch {
        // Consulta CAR é complementar; não bloqueia Onda A.
      }
    }

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
