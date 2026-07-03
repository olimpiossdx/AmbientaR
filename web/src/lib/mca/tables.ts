import type { FeatureCollection } from "geojson";
import area from "@turf/area";
import type { McaRlRow, McaTableRow } from "./types";

export function formatAreaBr(ha: number): string {
  return ha.toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function fcAreaHa(fc: FeatureCollection | undefined): number {
  if (!fc?.features?.length) return 0;
  return area(fc) / 10_000;
}

export function buildUsoTable(
  layers: Map<string, FeatureCollection>,
  totalHa: number,
): McaTableRow[] {
  const mapping: [string, string][] = [
    ["USO_LAVOURA", "Lavoura"],
    ["USO_PIVO", "Pivô"],
    ["USO_PASTO", "Pasto"],
    ["USO_EUCALIPTO", "Eucalipto"],
    ["USO_VEREDA", "Vereda"],
  ];
  const rows: McaTableRow[] = [];
  for (const [key, label] of mapping) {
    const ha = fcAreaHa(layers.get(key));
    if (ha <= 0) continue;
    rows.push({
      classe: label,
      areaHa: ha,
      percent: totalHa > 0 ? (ha / totalHa) * 100 : undefined,
    });
  }
  return rows.sort((a, b) => b.areaHa - a.areaHa);
}

export function buildAppTable(layers: Map<string, FeatureCollection>): McaTableRow[] {
  const ha = fcAreaHa(layers.get("AMB_APP"));
  if (ha <= 0) return [];
  return [{ classe: "APP", areaHa: ha, percent: 100 }];
}

export function buildRlTable(meta: McaRlRow[] | undefined): McaRlRow[] {
  return meta ?? [];
}

export function extractRlRowsFromLayers(
  layers: Map<string, FeatureCollection>,
  matriculas?: string[],
): McaRlRow[] {
  const fc = layers.get("AMB_RL_GLEBA");
  if (!fc?.features?.length) {
    return (matriculas ?? []).map((m, i) => ({
      matricula: m,
      gleba: `0${i + 1}`,
      areaHa: 0,
      compensada: false,
    }));
  }
  return fc.features.map((f, i) => {
    const ha = area(f) / 10_000;
    const p = f.properties ?? {};
    return {
      matricula: String(p.matricula ?? matriculas?.[i] ?? `M-${i + 1}`),
      gleba: String(p.gleba ?? `0${i + 1}`),
      areaHa: ha,
      compensada: Boolean(p.compensada),
    };
  });
}
