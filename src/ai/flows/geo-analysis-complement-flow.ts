"use server";

import { ai, aiModel, hasAiProvider } from "@/ai/genkit";
import { z } from "genkit";
import {
  GeoAnalysisComplementOutputSchema,
  type GeoLayerResult,
  type WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";
import { WAVE_ALL_LAYER_COUNT } from "@/lib/geospatial/run-wave-a-analysis";

function layersToFactsText(layers: GeoLayerResult[]): string {
  return layers
    .map((layer) => {
      const statsLines = layer.stats
        .map((s) => {
          const parts = [`  - ${s.label}`];
          if (s.pctOfPerimeter != null) parts.push(`${s.pctOfPerimeter}% do empreendimento`);
          if (s.areaHa != null) parts.push(`${s.areaHa} ha`);
          if (s.lengthKm != null) parts.push(`${s.lengthKm} km`);
          if (s.count != null) parts.push(`${s.count} feição(ões)`);
          return parts.join(" | ");
        })
        .join("\n");
      return [
        `### ${layer.title} (${layer.status})`,
        layer.summary,
        statsLines || "  (sem estatísticas)",
        layer.source
          ? `Fonte: ${layer.source.name} | ${layer.source.layerName} | ${layer.source.queriedAtUtc}`
          : "",
      ].join("\n");
    })
    .join("\n\n");
}

const complementPrompt = ai.definePrompt({
  name: "geoAnalysisComplementPrompt",
  model: aiModel,
  input: {
    schema: z.object({
      factualSummary: z.string(),
      areaHa: z.number(),
      layersFacts: z.string(),
    }),
  },
  output: { schema: GeoAnalysisComplementOutputSchema },
  prompt: `Você é o AmbientaR, consultor ambiental sênior em Minas Gerais.

Gere APENAS texto complementar para um relatório técnico, com base EXCLUSIVA nos dados factuais abaixo.
PROIBIDO inventar percentagens, áreas, nomes de rios, classes de solo ou bioma que não apareçam nos dados.
Se faltar dado, diga explicitamente que a camada não retornou interseção ou que o serviço estava indisponível.

Área do empreendimento: {{areaHa}} ha

Resumo factual:
{{factualSummary}}

Dados por camada (${WAVE_ALL_LAYER_COUNT} camadas — IDE-Sisema MG, SICAR e embargos IBAMA):
{{layersFacts}}

Mapeie mentalmente as camadas factuais para as secções abaixo (use os títulos das camadas no texto quando citar dados).
Estruture a saída JSON com:
- resumoExecutivo: 1 parágrafo integrando achados das camadas SIG (incl. cavidades/CECAV quando houver)
- sections: array com keys fixas (bodyMarkdown em português, 2–4 parágrafos por secção quando houver dados):
  - key "hidrografia", title "Hidrografia, massas d'água e APP"
  - key "bioma_vegetacao", title "Bioma, vegetação e cobertura"
  - key "meio_fisico", title "Solos, geologia e geomorfologia"
  - key "fauna", title "Fauna e ocorrências no perímetro"
  - key "recomendacoes", title "Recomendações, lacunas e próximos passos"
- status: sempre "rascunho_ia"
- disclaimer: aviso de revisão humana obrigatória
- generatedAtUtc: use timestamp atual em ISO

Tom técnico, referências genéricas à legislação MG (Código Florestal, COPAM) sem inventar artigos específicos se não tiver certeza.`,
});

const complementFlow = ai.defineFlow(
  {
    name: "geoAnalysisComplementFlow",
    inputSchema: z.object({
      geoAnalysisId: z.string(),
      waveResult: z.custom<WaveAAnalysisResult>(),
    }),
    outputSchema: GeoAnalysisComplementOutputSchema,
  },
  async ({ geoAnalysisId, waveResult }) => {
    if (!hasAiProvider) {
      throw new Error(
        "Complemento geo (leve) requer GOOGLE_GENAI_API_KEY ou GEMINI_API_KEY.",
      );
    }

    const { output } = await complementPrompt(
      {
        factualSummary: waveResult.factualSummary,
        areaHa: waveResult.perimeter.areaHa,
        layersFacts: layersToFactsText(waveResult.layers),
      },
      { model: aiModel },
    );

    if (!output) {
      throw new Error("A IA não gerou o complemento.");
    }

    return {
      ...output,
      geoAnalysisId,
      status: "rascunho_ia" as const,
      generatedAtUtc: new Date().toISOString(),
      disclaimer:
        output.disclaimer ||
        "Rascunho gerado por IA com base na análise factual (SIG MG). Revisão por profissional habilitado é obrigatória antes de uso em estudo ou órgão licenciador.",
    };
  },
);

export async function generateGeoAnalysisComplement(params: {
  geoAnalysisId: string;
  waveResult: WaveAAnalysisResult;
}) {
  return complementFlow(params);
}
