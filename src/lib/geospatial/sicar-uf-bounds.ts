/** Extents aproximados das camadas sicar:sicar_imoveis_{uf} (GeoServer CAR, EPSG:4674). */
export const SICAR_UF_BBOX: Record<string, [number, number, number, number]> = {
  ac: [-73.8, -11.15, -66.62, -7.11],
  al: [-38.23, -10.47, -35.16, -8.82],
  am: [-73.8, -9.82, -56.09, 1.23],
  ap: [-53.09, -1.23, -49.91, 3.95],
  ba: [-46.61, -18.33, -37.36, -8.53],
  ce: [-41.42, -7.86, -37.26, -2.79],
  DF: [-48.29, -16.07, -47.31, -15.48],
  es: [-41.88, -21.3, -39.66, -17.89],
  go: [-53.25, -19.46, -45.91, -12.4],
  ma: [-48.8, -8.0, -41.8, -1.0],
  mg: [-51.13, -22.92, -36.03, -14.23],
  ms: [-58.17, -24.04, -50.94, -17.17],
  mt: [-61.63, -18.04, -50.22, -7.6],
  pa: [-58.23, -9.84, -46.07, 0.65],
  pb: [-38.77, -8.32, -34.8, -6.03],
  pe: [-41.36, -9.48, -34.79, -7.27],
  pi: [-46.0, -10.93, -40.37, -2.75],
  pr: [-54.62, -26.69, -48.03, -22.52],
  rj: [-44.88, -23.37, -40.96, -20.76],
  rn: [-38.58, -6.98, -34.97, -4.82],
  ro: [-66.81, -13.68, -59.78, -7.95],
  rr: [-62.17, -1.59, -58.89, 4.39],
  rs: [-57.6, -33.75, -49.69, -27.08],
  sc: [-53.84, -29.33, -48.38, -25.96],
  se: [-37.21, -10.39, -36.93, -10.16],
  sp: [-53.1, -25.25, -44.17, -19.3],
  to: [-50.7, -13.5, -45.5, -5.2],
};

function bboxOverlaps(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

/** UFs cujo extent intersecta o bbox da consulta (máx. 4, priorizando MG). */
export function resolveUfsForBbox(
  bbox: [number, number, number, number],
  max = 4,
): string[] {
  const hits: string[] = [];
  if (bboxOverlaps(bbox, SICAR_UF_BBOX.mg)) hits.push("mg");
  for (const [ufKey, ufBox] of Object.entries(SICAR_UF_BBOX)) {
    if (ufKey === "mg") continue;
    if (bboxOverlaps(bbox, ufBox)) hits.push(ufKey);
  }
  return hits.slice(0, max);
}

export function extractUfFromCodImovel(codImovel: string): string | null {
  const trimmed = codImovel.trim();
  const match = trimmed.match(/^([A-Za-z]{2})-/);
  if (!match?.[1]) return null;
  const uf = match[1].toUpperCase();
  return uf === "DF" ? "DF" : uf.toLowerCase();
}

export function sicarTypeNameForUf(uf: string): string {
  const normalized = uf === "DF" ? "DF" : uf.toLowerCase();
  return `sicar:sicar_imoveis_${normalized}`;
}
