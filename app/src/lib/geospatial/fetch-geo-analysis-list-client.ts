import type { GeoAnalysisListSummary } from "@/lib/geospatial/geo-analysis-summary";

export type GeoAnalysisListRow = {
  id: string;
  wave: string;
  empreendimentoId?: string;
  listSummary: GeoAnalysisListSummary;
};

/** Lista leve via API (sem transferir `layers` completos). */
export async function fetchGeoAnalysisListClient(
  idToken: string,
  opts?: { empreendimentoId?: string; limit?: number },
): Promise<GeoAnalysisListRow[]> {
  const params = new URLSearchParams();
  if (opts?.empreendimentoId) {
    params.set("empreendimentoId", opts.empreendimentoId);
  }
  if (opts?.limit) params.set("limit", String(opts.limit));

  const res = await fetch(`/api/geo-analyses?${params}`, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: "no-store",
  });
  const data = (await res.json()) as {
    success?: boolean;
    analyses?: GeoAnalysisListRow[];
    error?: string;
  };
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Falha ao listar análises geoespaciais.");
  }
  return data.analyses ?? [];
}
