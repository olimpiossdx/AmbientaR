import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import {
  summaryFromFirestoreDoc,
  type GeoAnalysisListSummary,
} from "@/lib/geospatial/geo-analysis-summary";

export type GeoAnalysisListItem = {
  id: string;
  wave: string;
  empreendimentoId?: string;
  createdAtMs: number;
  listSummary: GeoAnalysisListSummary;
};

const LIST_FIELDS = [
  "wave",
  "generatedAtUtc",
  "createdAt",
  "empreendimentoId",
  "listSummary",
  "perimeter",
] as const;

function createdAtMs(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "object" && v !== null && "toMillis" in v) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === "string") return Date.parse(v) || 0;
  return 0;
}

/** Lista análises do utilizador sem carregar o array `layers` (field mask Admin). */
export async function listGeoAnalysesForUserServer(
  userId: string,
  opts?: { empreendimentoId?: string; limit?: number },
): Promise<GeoAnalysisListItem[]> {
  const max = Math.min(opts?.limit ?? 25, 40);
  const snap = await studyMapsAdminDb()
    .collection("geo_analyses")
    .where("createdBy", "==", userId)
    .select(...LIST_FIELDS)
    .limit(max)
    .get();

  const items: GeoAnalysisListItem[] = [];
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const wave = data.wave as string | undefined;
    if (wave !== "A" && wave !== "ABC") continue;
    if (
      opts?.empreendimentoId &&
      data.empreendimentoId !== opts.empreendimentoId
    ) {
      continue;
    }
    const listSummary = summaryFromFirestoreDoc(data);
    if (!listSummary) continue;
    items.push({
      id: d.id,
      wave,
      empreendimentoId: data.empreendimentoId as string | undefined,
      createdAtMs: createdAtMs(data.createdAt),
      listSummary,
    });
  }

  return items.sort((a, b) => b.createdAtMs - a.createdAtMs);
}
