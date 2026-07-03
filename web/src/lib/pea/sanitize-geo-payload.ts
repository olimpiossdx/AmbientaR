import type { PeaGeoVinculo } from '@/lib/pea/types';

/** Evita gravar string vazia no Firestore. */
export function sanitizeGeoAnalysisId(id?: string | null): string | undefined {
  const trimmed = id?.trim();
  return trimmed || undefined;
}

/** Mantém vínculo só se houver análise ou geometria importada. */
export function sanitizeGeoVinculo(
  v?: PeaGeoVinculo | null,
): PeaGeoVinculo | undefined {
  if (!v) return undefined;
  const analysisId = v.analysisId?.trim() ?? '';
  if (!analysisId && !v.geometrySource) return undefined;
  if (!analysisId) {
    const { analysisId: _drop, ...rest } = v;
    return rest;
  }
  return { ...v, analysisId };
}
