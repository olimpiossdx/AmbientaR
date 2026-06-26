import type { McpRagCostBreakdown } from "@/lib/mcp-rag/types";

/** Estimativa conservadora (USD) — não substitui billing GCP; orienta o admin. */
const USD_PER_1K_EMBEDDING = 0.0001;
const USD_PER_OCR_PAGE = 0.01;

export function estimateMcpRagCosts(input: {
  cloudRagChunks: number;
  juridicaChunks: number;
  ocrDocuments?: number;
}): McpRagCostBreakdown {
  const cloudRagChunks = Math.max(0, input.cloudRagChunks);
  const juridicaChunks = Math.max(0, input.juridicaChunks);
  const totalChunks = cloudRagChunks + juridicaChunks;
  const ocrDocs = Math.max(0, input.ocrDocuments ?? 0);

  const embeddingEstimateUsd =
    (totalChunks / 1000) * USD_PER_1K_EMBEDDING;
  const ocrEstimateUsd = ocrDocs * 10 * USD_PER_OCR_PAGE;

  const notes: string[] = [
    "Valores aproximados para planeamento; consulte faturação GCP/Firebase.",
    "Embeddings reutilizados por hash reduzem custo em reprocessamentos.",
  ];

  if (totalChunks === 0) {
    notes.push("Sem chunks indexados — custo de embedding tende a zero.");
  }

  return {
    cloudRagChunks,
    juridicaChunks,
    embeddingEstimateUsd: roundUsd(embeddingEstimateUsd),
    ocrEstimateUsd: roundUsd(ocrEstimateUsd),
    totalEstimateUsd: roundUsd(embeddingEstimateUsd + ocrEstimateUsd),
    periodLabel: "Estimativa acumulada (índice atual)",
    notes,
  };
}

function roundUsd(value: number): number {
  return Math.round(value * 10000) / 10000;
}
