"use server";

import { analyseArea } from "@/ai/flows/analise-ambiental-flow";
import type {
  AnaliseAmbientalInput,
  AnaliseAmbientalOutput,
} from "@/lib/types/analise-ambiental";

type AnalyseAreaActionResult =
  | { success: true; result: AnaliseAmbientalOutput }
  | { success: false; error: string };

export async function handleAnalyseArea(
  input: AnaliseAmbientalInput,
): Promise<AnalyseAreaActionResult> {
  try {
    const result = await analyseArea(input);

    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível processar a análise geoespacial.",
    };
  }
}
