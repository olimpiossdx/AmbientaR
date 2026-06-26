import type { Firestore } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import type {
  GeoAnalysisComplementOutput,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";

export type GeoAnalysisBundle = {
  analysisId: string;
  wave: WaveAAnalysisResult;
  complement: GeoAnalysisComplementOutput | null;
  empreendimentoId?: string;
};

function docToWave(data: Record<string, unknown>): WaveAAnalysisResult | null {
  if ((data.wave !== "A" && data.wave !== "ABC") || !data.perimeter || !data.layers) {
    return null;
  }
  return {
    wave: data.wave === "ABC" ? "ABC" : "A",
    generatedAtUtc: (data.generatedAtUtc as string) ?? new Date().toISOString(),
    perimeter: data.perimeter as WaveAAnalysisResult["perimeter"],
    layers: data.layers as WaveAAnalysisResult["layers"],
    factualSummary: (data.factualSummary as string) ?? "",
    fontesConsultadas:
      (data.fontesConsultadas as WaveAAnalysisResult["fontesConsultadas"]) ?? [],
    zeeContext: data.zeeContext as WaveAAnalysisResult["zeeContext"],
    hidrologiaContext:
      data.hidrologiaContext as WaveAAnalysisResult["hidrologiaContext"],
  };
}

export async function loadGeoAnalysisBundle(
  firestore: Firestore,
  analysisId: string,
  userId: string,
): Promise<GeoAnalysisBundle | null> {
  const snap = await getDoc(doc(firestore, "geo_analyses", analysisId));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (data.createdBy !== userId) return null;
  const wave = docToWave(data);
  if (!wave) return null;

  let complement: GeoAnalysisComplementOutput | null = null;
  const compSnap = await getDocs(
    query(
      collection(firestore, "geo_analysis_complements"),
      where("geoAnalysisId", "==", analysisId),
      limit(10),
    ),
  );
  const compRow = compSnap.docs
    .map((d) => d.data())
    .filter((c) => c.createdBy === userId)
    .sort((a, b) => {
      const ta =
        a.createdAt && typeof a.createdAt === "object" && "toMillis" in a.createdAt
          ? (a.createdAt as { toMillis: () => number }).toMillis()
          : 0;
      const tb =
        b.createdAt && typeof b.createdAt === "object" && "toMillis" in b.createdAt
          ? (b.createdAt as { toMillis: () => number }).toMillis()
          : 0;
      return tb - ta;
    })[0];

  if (compRow?.sections) {
    complement = {
      geoAnalysisId: analysisId,
      sections: compRow.sections as GeoAnalysisComplementOutput["sections"],
      resumoExecutivo: compRow.resumoExecutivo as string,
      status: (compRow.status as GeoAnalysisComplementOutput["status"]) ?? "rascunho_ia",
      generatedAtUtc:
        (compRow.generatedAtUtc as string) ?? new Date().toISOString(),
      disclaimer: (compRow.disclaimer as string) ?? "",
    };
  }

  return {
    analysisId,
    wave,
    complement,
    empreendimentoId: data.empreendimentoId as string | undefined,
  };
}

/** Lista análises do utilizador (ondas A/ABC), mais recentes primeiro. */
export async function listGeoAnalysesForUser(
  firestore: Firestore,
  userId: string,
  empreendimentoId?: string,
  idToken?: string,
): Promise<
  { id: string; areaHa: number; generatedAtUtc: string; okCount: number; total: number }[]
> {
  if (idToken) {
    try {
      const { fetchGeoAnalysisListClient } = await import(
        "@/lib/geospatial/fetch-geo-analysis-list-client"
      );
      const rows = await fetchGeoAnalysisListClient(idToken, {
        empreendimentoId,
        limit: 25,
      });
      return rows
        .map((r) => ({
          id: r.id,
          empreendimentoId: r.empreendimentoId,
          areaHa: r.listSummary.areaHa,
          generatedAtUtc: r.listSummary.generatedAtUtc,
          okCount: r.listSummary.okCount,
          total: r.listSummary.totalLayers,
        }))
        .filter((a) => a.areaHa > 0);
    } catch {
      /* fallback Firestore */
    }
  }

  const snap = await getDocs(
    query(collection(firestore, "geo_analyses"), where("createdBy", "==", userId), limit(25)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      const layers = (data.layers as WaveAAnalysisResult["layers"]) ?? [];
      const wave = data.wave as string | undefined;
      if (wave !== "A" && wave !== "ABC") return null;
      const listSummary = data.listSummary as
        | { areaHa?: number; okCount?: number; totalLayers?: number; generatedAtUtc?: string }
        | undefined;
      return {
        id: d.id,
        empreendimentoId: data.empreendimentoId as string | undefined,
        areaHa:
          listSummary?.areaHa ??
          (data.perimeter as { areaHa?: number })?.areaHa ??
          0,
        generatedAtUtc:
          listSummary?.generatedAtUtc ?? ((data.generatedAtUtc as string) ?? ""),
        okCount:
          listSummary?.okCount ?? layers.filter((l) => l.status === "ok").length,
        total: listSummary?.totalLayers ?? (layers.length || 8),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a != null && a.areaHa > 0)
    .filter((a) => !empreendimentoId || a.empreendimentoId === empreendimentoId)
    .sort((a, b) => b.generatedAtUtc.localeCompare(a.generatedAtUtc));
}
