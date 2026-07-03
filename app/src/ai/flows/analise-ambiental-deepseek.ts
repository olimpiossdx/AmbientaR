"use server";

import { deepseekChatCompletion } from "@/lib/deepseek-chat-server";
import { fetchCarData, runGeospatialOverlay } from "@/lib/geospatial/geo-analysis-service";
import {
  AnaliseAmbientalOutputSchema,
  type AnaliseAmbientalInput,
  type AnaliseAmbientalOutput,
} from "@/lib/types/analise-ambiental";
import { z } from "zod";

const GEO_DEEPSEEK_PREFIX =
  'És o "AmbientaR", assistente de consultoria ambiental em Minas Gerais e Brasil. ' +
  "Gera relatórios técnicos só com base nos dados factuais fornecidos; não inventes percentagens, rios ou biomas ausentes nos dados.";

const DeepseekAnalisePayloadSchema = z.object({
  resumoIA: z.string().min(1),
  analises: z
    .array(
      z.object({
        titulo: z.string().min(1),
        relatorio: z.string().min(1),
      }),
    )
    .min(1),
});

const EXPECTED_SECTION_TITLES = [
  "Dados do Imóvel (CAR)",
  "Bioma e Fitofisionomia",
  "Recursos Hídricos e APP",
  "Unidades de Conservação",
  "Análise de Imagens (Simulação)",
  "Conclusão e Recomendações",
] as const;

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("A resposta da IA não contém JSON válido.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function formatUcLine(
  uc: Awaited<ReturnType<typeof runGeospatialOverlay>>["sobreposicaoUC"],
): string {
  if (uc.ocorreu) {
    return `sobreposição — ${uc.nomeUC ?? "—"}`;
  }
  let text = "sem sobreposição";
  if (uc.nomeUC) text += ` (${uc.nomeUC})`;
  if (uc.distanciaKm != null) text += `; distância ~${uc.distanciaKm} km`;
  return text;
}

function buildFactsPrompt(
  input: AnaliseAmbientalInput,
  overlay: Awaited<ReturnType<typeof runGeospatialOverlay>>,
  carData: Awaited<ReturnType<typeof fetchCarData>> | null,
): string {
  const dataPreview =
    input.data.length > 2000 ? `${input.data.slice(0, 2000)}…` : input.data;

  const lines: string[] = [
    "## Entrada do utilizador",
    `- Modo: ${input.dataType}`,
    `- Dado (resumo): ${dataPreview}`,
    "",
    "## Sobreposição geoespacial (consulta factual)",
    `- Bioma: ${overlay.bioma}`,
    `- UC: ${formatUcLine(overlay.sobreposicaoUC)}`,
    "- Hidrografia:",
  ];

  for (const h of overlay.hidrografia) {
    lines.push(`  - ${h.nome} (${h.tipo})`);
  }

  lines.push("", "## Camadas factuais (Onda A / IDE-Sisema)");
  for (const item of overlay.factualData) {
    lines.push(
      `- ${item.camada}: ${item.resultado}${item.areaHa != null ? ` (${item.areaHa} ha)` : ""} [${item.fonte}; ${item.metodo}]`,
    );
  }

  if (carData) {
    lines.push(
      "",
      "## Dados CAR (SICAR — WFS público)",
      `- Código: ${carData.codImovel}`,
      `- Área total declarada: ${carData.areaTotal} ha`,
      `- Situação: ${carData.situacao}`,
      `- Status: ${carData.statusCodigo}${carData.condicao ? ` (${carData.condicao})` : ""}`,
      `- Município/UF: ${carData.municipio}/${carData.uf}`,
    );
    if (carData.aviso) {
      lines.push(`- Nota: ${carData.aviso}`);
    }
  } else if (overlay.carImoveis?.length) {
    lines.push(
      "",
      "## Imóveis CAR no perímetro (SICAR — WFS público)",
      ...overlay.carImoveis.map(
        (i) =>
          `- ${i.codImovel}: ${i.situacao} · ${i.areaHa.toFixed(2)} ha · ${i.municipio}/${i.uf}`,
      ),
    );
  }

  lines.push(
    "",
    "## Fontes consultadas",
    ...overlay.fontesConsultadas.map((f) => `- ${f.nome}: ${f.url} (${f.tipo})`),
  );

  return lines.join("\n");
}

function buildUserPrompt(factsBlock: string): string {
  return `${factsBlock}

Com base APENAS nos dados acima, responde com um único objeto JSON (sem markdown extra), exatamente neste formato:
{
  "resumoIA": "parágrafo executivo de 2-4 frases",
  "analises": [
    { "titulo": "Dados do Imóvel (CAR)", "relatorio": "..." },
    { "titulo": "Bioma e Fitofisionomia", "relatorio": "..." },
    { "titulo": "Recursos Hídricos e APP", "relatorio": "..." },
    { "titulo": "Unidades de Conservação", "relatorio": "..." },
    { "titulo": "Análise de Imagens (Simulação)", "relatorio": "..." },
    { "titulo": "Conclusão e Recomendações", "relatorio": "..." }
  ]
}

Regras:
- Cite limitações de conectividade quando os dados forem fallback ou indisponíveis.
- Tom técnico; referências genéricas ao Código Florestal e normas MG/COPAM sem inventar artigos se não tiver certeza.
- Seções obrigatórias com estes títulos: ${EXPECTED_SECTION_TITLES.join("; ")}.`;
}

export async function analyseAreaWithDeepseek(
  input: AnaliseAmbientalInput,
  apiKey: string,
): Promise<AnaliseAmbientalOutput> {
  const factualOverlay = await runGeospatialOverlay(input.data, input.dataType);
  let carData: Awaited<ReturnType<typeof fetchCarData>> | null = null;
  if (input.dataType === "car") {
    try {
      carData = await fetchCarData(input.data);
    } catch {
      carData = null;
    }
  } else if (factualOverlay.carImoveis?.length === 1) {
    const i = factualOverlay.carImoveis[0];
    carData = {
      codImovel: i.codImovel,
      areaTotal: i.areaHa,
      situacao: i.situacao,
      statusCodigo: i.statusCodigo,
      condicao: i.condicao,
      municipio: i.municipio,
      uf: i.uf,
      fonte: "sicar-wfs-publico",
      aviso:
        "APP e Reserva Legal declaradas não constam na camada pública de área do imóvel.",
    };
  }

  const result = await deepseekChatCompletion(
    {
      prompt: buildUserPrompt(buildFactsPrompt(input, factualOverlay, carData)),
      tipo: "geral",
      systemPrefix: GEO_DEEPSEEK_PREFIX,
      temperature: 0.2,
      max_tokens: 4096,
    },
    apiKey,
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  let parsed: z.infer<typeof DeepseekAnalisePayloadSchema>;
  try {
    const raw = extractJsonObject(result.reply);
    const validated = DeepseekAnalisePayloadSchema.safeParse(raw);
    if (!validated.success) {
      throw new Error(validated.error.message);
    }
    parsed = validated.data;
  } catch (e) {
    const detail = e instanceof Error ? e.message : "formato inválido";
    throw new Error(
      `A DeepSeek respondeu, mas o relatório não pôde ser estruturado (${detail}). Tente novamente.`,
    );
  }

  const full = AnaliseAmbientalOutputSchema.safeParse({
    ...parsed,
    generatedAtUtc: new Date().toISOString(),
    factualData: factualOverlay.factualData,
    fontesConsultadas: factualOverlay.fontesConsultadas,
  });

  if (!full.success) {
    throw new Error("Relatório gerado com estrutura incompleta.");
  }

  return full.data;
}
