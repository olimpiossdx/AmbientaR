"use server";

import { ai, aiModel, hasAiProvider } from "@/ai/genkit";
import { z } from "genkit";
import { deepseekJsonCompletion } from "@/lib/ai-deepseek-json";
import { getDeepseekApiKey } from "@/lib/deepseek-env";
import { hasGeminiApiKey } from "@/lib/gemini-env";
import type { AiProviderId } from "@/lib/ai-provider-labels";
import {
  buildGeoComplementUserPrompt,
  GEO_COMPLEMENT_SYSTEM_PROMPT,
  layersToFactsText,
} from "@/lib/geospatial/geo-complement-prompt";
import {
  GeoAnalysisComplementOutputSchema,
  type GeoAnalysisComplementOutput,
  type WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";

const ComplementLlmSchema = GeoAnalysisComplementOutputSchema.omit({
  geoAnalysisId: true,
});

const complementPrompt = ai.definePrompt({
  name: "geoAnalysisComplementPromptV2",
  model: aiModel,
  input: {
    schema: z.object({
      userPrompt: z.string(),
    }),
  },
  output: { schema: ComplementLlmSchema },
  prompt: `${GEO_COMPLEMENT_SYSTEM_PROMPT}

{{userPrompt}}`,
});

export async function generateGeoComplementWithProvider(params: {
  geoAnalysisId: string;
  waveResult: WaveAAnalysisResult;
  provider: AiProviderId;
}): Promise<GeoAnalysisComplementOutput> {
  const layersFacts = layersToFactsText(params.waveResult.layers);
  const userPrompt = buildGeoComplementUserPrompt({
    factualSummary: params.waveResult.factualSummary,
    areaHa: params.waveResult.perimeter.areaHa,
    layersFacts,
  });

  let body: z.infer<typeof ComplementLlmSchema>;

  if (params.provider === "deepseek") {
    const apiKey = getDeepseekApiKey();
    if (!apiKey) {
      throw new Error("Configure DEEPSEEK_API_KEY para complemento com DeepSeek.");
    }
    body = await deepseekJsonCompletion(apiKey, {
      system: GEO_COMPLEMENT_SYSTEM_PROMPT,
      user: userPrompt,
      schema: ComplementLlmSchema,
      max_tokens: 4096,
    });
  } else {
    if (!hasGeminiApiKey() && !hasAiProvider) {
      throw new Error(
        "Configure GOOGLE_GENAI_API_KEY para complemento com Gemini.",
      );
    }
    const { output } = await complementPrompt(
      { userPrompt },
      { model: aiModel },
    );
    if (!output) {
      throw new Error("A IA não gerou o complemento.");
    }
    body = output;
  }

  return {
    ...body,
    geoAnalysisId: params.geoAnalysisId,
    status: "rascunho_ia",
    generatedAtUtc: new Date().toISOString(),
    disclaimer:
      body.disclaimer ||
      "Rascunho gerado por IA com base na análise factual (SIG MG). Revisão por profissional habilitado é obrigatória antes de uso em estudo ou órgão licenciador.",
  };
}
