import type { ParcelaCoordenada } from '@/lib/types';
import {
  formatCoordinateBlockForLegacyString,
  monitoringCoordenadasToLatLng,
  parseLegacyCoordenadasString,
  type MonitoringPontoCoordenadasForm,
} from '@/lib/monitoring-pontos-form';

export const VERTICES_AMARRACAO_COUNT = 4;

export type VerticeForm = { coordenadas: string };

export function emptyVerticesForm(): VerticeForm[] {
  return Array.from({ length: VERTICES_AMARRACAO_COUNT }, () => ({
    coordenadas: '',
  }));
}

/** @deprecated Preferir `parseLatLngFromCoordenadasString`. */
export function parseCoordInput(value: string): number | undefined {
  const t = value.trim();
  if (!t) return undefined;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

/** Converte string GMS/UTM ou par decimal em `{ latitude, longitude }`. */
export function parseLatLngFromCoordenadasString(raw?: string | null): {
  latitude?: number;
  longitude?: number;
} {
  const trimmed = raw?.trim();
  if (!trimmed) return {};
  const block = parseLegacyCoordenadasString(trimmed);
  const fromBlock = monitoringCoordenadasToLatLng(block);
  if (fromBlock.lat != null && fromBlock.lng != null) {
    return { latitude: fromBlock.lat, longitude: fromBlock.lng };
  }
  const single = parseCoordInput(trimmed);
  if (single != null) return { latitude: single };
  return {};
}

/** Serializa par decimal Firestore para edição no formulário unificado. */
export function latLngToCoordenadasString(
  latitude?: number | null,
  longitude?: number | null,
): string {
  if (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return formatCoordinateBlockForLegacyString(
      parseLegacyCoordenadasString(`${latitude}, ${longitude}`),
    );
  }
  return '';
}

export function buildAreaAmarracaoFromInputs(
  vertices: VerticeForm[],
): ParcelaCoordenada[] | undefined {
  const pts = vertices
    .map((v) => {
      const { latitude, longitude } = parseLatLngFromCoordenadasString(
        v.coordenadas,
      );
      if (latitude != null && longitude != null) {
        return { latitude, longitude };
      }
      return null;
    })
    .filter((p): p is ParcelaCoordenada => p != null);
  return pts.length ? pts : undefined;
}

export function verticesFromAreaAmarracao(
  area?: ParcelaCoordenada[] | null,
): VerticeForm[] {
  const base = emptyVerticesForm();
  if (!area?.length) return base;
  area.slice(0, VERTICES_AMARRACAO_COUNT).forEach((pt, index) => {
    base[index] = {
      coordenadas: latLngToCoordenadasString(pt.latitude, pt.longitude),
    };
  });
  return base;
}

export type { MonitoringPontoCoordenadasForm };
