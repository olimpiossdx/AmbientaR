import type { WaveAAnalysisResult } from '@/lib/types/geo-wave-a';
import {
  CAVIDADES_POTENCIAL_LAYER_ID,
  inferTriagemFromPotencialStats,
  type CavidadesTriagemFromGeo,
} from '@/lib/geospatial/cavidades-potencial';

export const CAVIDADES_TRIAGEM_SESSION_KEY = 'ambientar_cavidades_triagem_geo';

export function extractTriagemFromWaveResult(
  wave: WaveAAnalysisResult,
): CavidadesTriagemFromGeo | null {
  const layer = wave.layers.find((l) => l.layerId === CAVIDADES_POTENCIAL_LAYER_ID);
  if (!layer) return null;
  return inferTriagemFromPotencialStats(
    layer.stats,
    layer.summary,
    wave.perimeter.areaHa,
  );
}

export function saveTriagemToSession(payload: CavidadesTriagemFromGeo): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(CAVIDADES_TRIAGEM_SESSION_KEY, JSON.stringify(payload));
}

export function loadTriagemFromSession(): CavidadesTriagemFromGeo | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(CAVIDADES_TRIAGEM_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CavidadesTriagemFromGeo;
  } catch {
    return null;
  }
}

export function clearTriagemSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(CAVIDADES_TRIAGEM_SESSION_KEY);
}
