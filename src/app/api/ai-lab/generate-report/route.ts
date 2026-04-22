import { NextRequest, NextResponse } from "next/server";
import { generateAbntReport } from "@/ai/flows/generate-abnt-report";
import { formatAbntWebReference } from "@/lib/abnt";
import { isAiRoutesEnabled } from "@/lib/deploy-flags";

export const maxDuration = 90;
const MAX_INTERNAL_SOURCES = 8;
const MAX_EXTERNAL_URLS = 3;
const MAX_TOTAL_SOURCE_CHARS = 40000;
const MAX_ADDITIONAL_INSTRUCTIONS_CHARS = 2000;
const BRL_PER_1K_CHARS_ESTIMATE = 0.03;

type InternalSource = {
  id: string;
  title: string;
  content: string;
};

type Body = {
  reportTitle?: string;
  objective?: string;
  additionalInstructions?: string;
  internalSources?: InternalSource[];
  externalUrls?: string[];
};

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampText(value: string, max = 12000): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function estimateGenerationCostBRL(inputChars: number) {
  const estimated = (inputChars / 1000) * BRL_PER_1K_CHARS_ESTIMATE;
  return Number(Math.max(0.01, estimated).toFixed(4));
}

async function fetchExternalSource(
  url: string,
): Promise<{ title: string; url: string; content: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Falha ao buscar URL (${res.status})`);
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || url;
    const content = clampText(stripHtmlToText(html));
    return { title, url, content };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  if (!isAiRoutesEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Geração de relatório por IA está desativada temporariamente para estabilização do deploy.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Body;
    const reportTitle = (body.reportTitle || "").trim();
    const objective = (body.objective || "").trim();
    const additionalInstructions = (body.additionalInstructions || "").trim();
    const internalSources = Array.isArray(body.internalSources)
      ? body.internalSources
      : [];
    const externalUrls = Array.isArray(body.externalUrls)
      ? body.externalUrls.filter(Boolean)
      : [];

    if (!reportTitle || !objective) {
      return NextResponse.json(
        { success: false, error: "reportTitle e objective são obrigatórios." },
        { status: 400 },
      );
    }

    if (internalSources.length === 0 && externalUrls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe ao menos uma fonte interna ou uma URL externa.",
        },
        { status: 400 },
      );
    }

    if (internalSources.length > MAX_INTERNAL_SOURCES) {
      return NextResponse.json(
        {
          success: false,
          error: `Limite de ${MAX_INTERNAL_SOURCES} fontes internas por requisição.`,
        },
        { status: 400 },
      );
    }

    if (externalUrls.length > MAX_EXTERNAL_URLS) {
      return NextResponse.json(
        {
          success: false,
          error: `Limite de ${MAX_EXTERNAL_URLS} URLs externas por requisição.`,
        },
        { status: 400 },
      );
    }

    const externalSourcesResults = await Promise.allSettled(
      externalUrls.map((url) => fetchExternalSource(url)),
    );

    const externalSources = externalSourcesResults
      .filter(
        (
          r,
        ): r is PromiseFulfilledResult<{
          title: string;
          url: string;
          content: string;
        }> => r.status === "fulfilled",
      )
      .map((r) => r.value);

    const externalErrors = externalSourcesResults
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason?.message || "Falha ao obter fonte externa");

    const sources = [
      ...internalSources.map((s) => ({
        title: s.title,
        content: clampText(s.content, 16000),
        sourceType: "internal" as const,
      })),
      ...externalSources.map((s) => ({
        title: s.title,
        url: s.url,
        content: s.content,
        sourceType: "external" as const,
      })),
    ];

    const totalChars =
      sources.reduce((acc, s) => acc + (s.content?.length || 0), 0) +
      reportTitle.length +
      objective.length +
      additionalInstructions.length;
    if (
      totalChars > MAX_TOTAL_SOURCE_CHARS ||
      additionalInstructions.length > MAX_ADDITIONAL_INSTRUCTIONS_CHARS
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Entrada muito grande para manter custo controlado. Reduza fontes/URLs ou resumo do conteúdo.",
        },
        { status: 400 },
      );
    }

    const result = await generateAbntReport({
      reportTitle,
      objective,
      additionalInstructions,
      sources,
    });
    const estimatedCostBRL = estimateGenerationCostBRL(totalChars);

    const references = result.citations.map((c) => {
      if (c.sourceType === "external" && c.url) {
        return formatAbntWebReference({
          title: c.title,
          url: c.url,
          accessedAt: new Date(),
        });
      }
      return `${c.title.toUpperCase()}. Documento interno da organização.`;
    });

    return NextResponse.json({
      success: true,
      report: result.report,
      citations: result.citations,
      references,
      externalErrors,
      usedSources: sources.length,
      estimatedCostBRL,
      estimatedInputChars: totalChars,
      guardrails: {
        maxInternalSources: MAX_INTERNAL_SOURCES,
        maxExternalUrls: MAX_EXTERNAL_URLS,
        maxTotalChars: MAX_TOTAL_SOURCE_CHARS,
      },
    });
  } catch (e) {
    console.error("POST /api/ai-lab/generate-report:", e);
    return NextResponse.json(
      {
        success: false,
        error: (e as Error).message || "Erro ao gerar relatório.",
      },
      { status: 500 },
    );
  }
}
