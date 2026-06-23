import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import { WAVE_ALL_LAYER_COUNT } from "@/lib/geospatial/geo-constants";

export function layersToFactsText(layers: GeoLayerResult[]): string {
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

export function buildGeoComplementUserPrompt(params: {
  factualSummary: string;
  areaHa: number;
  layersFacts: string;
}): string {
  return `Área do empreendimento: ${params.areaHa} ha

Resumo factual:
${params.factualSummary}

Dados por camada (${WAVE_ALL_LAYER_COUNT} camadas — IDE-Sisema MG, SICAR e embargos IBAMA):
${params.layersFacts}

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

Tom técnico, referências genéricas à legislação MG (Código Florestal, COPAM) sem inventar artigos específicos se não tiver certeza.`;
}

export const GEO_COMPLEMENT_SYSTEM_PROMPT = `Você é o AmbientaR, consultor ambiental sênior em Minas Gerais.

Gere APENAS texto complementar para um relatório técnico, com base EXCLUSIVA nos dados factuais fornecidos.
PROIBIDO inventar percentagens, áreas, nomes de rios, classes de solo ou bioma que não apareçam nos dados.
Se faltar dado, diga explicitamente que a camada não retornou interseção ou que o serviço estava indisponível.
Responda somente com JSON válido conforme o schema pedido.`;
