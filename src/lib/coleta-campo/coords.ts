import type { ParcelaCoordenada } from '@/lib/types';

export const VERTICES_AMARRACAO_COUNT = 4;

export type VerticeForm = { lat: string; lng: string };

export function emptyVerticesForm(): VerticeForm[] {
  return Array.from({ length: VERTICES_AMARRACAO_COUNT }, () => ({ lat: '', lng: '' }));
}

export function parseCoordInput(value: string): number | undefined {
  const t = value.trim();
  if (!t) return undefined;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

export function buildAreaAmarracaoFromInputs(vertices: VerticeForm[]): ParcelaCoordenada[] | undefined {
  const pts = vertices
    .map((v) => {
      const latitude = parseCoordInput(v.lat);
      const longitude = parseCoordInput(v.lng);
      if (latitude != null && longitude != null) return { latitude, longitude };
      return null;
    })
    .filter((p): p is ParcelaCoordenada => p != null);
  return pts.length ? pts : undefined;
}
