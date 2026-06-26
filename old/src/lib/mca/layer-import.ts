import type { Feature, FeatureCollection } from "geojson";
import { featureCollection } from "@turf/helpers";

/** Mapeamento layer CAD → layerKey MCA (ver CAD-LAYER-CATALOG.md). */
export const CAD_LAYER_TO_MCA: Record<string, string> = {
  LAVOURA: "USO_LAVOURA",
  LAVOURAS: "USO_LAVOURA",
  PIVOT: "USO_PIVO",
  PIVÔ: "USO_PIVO",
  PIVO: "USO_PIVO",
  PASTO: "USO_PASTO",
  PASTAGEM: "USO_PASTO",
  EUCALIPTO: "USO_EUCALIPTO",
  APP: "AMB_APP",
  RL: "AMB_RL_GLEBA",
  RESERVA_LEGAL: "AMB_RL_GLEBA",
  CORREGO: "HYD_CORREGO",
  CÓRREGO: "HYD_CORREGO",
  RIBEIRAO: "HYD_RIBEIRAO",
  RIBEIRÃO: "HYD_RIBEIRAO",
  VEREDA: "HYD_VEREDA",
  GROTA: "HYD_GROTA",
  SEDE: "INFRA_SEDE",
  SILOS: "INFRA_SILOS",
  PERIMETRO: "FUND_LIMITE",
  PERÍMETRO: "FUND_LIMITE",
};

export function normalizeCadLayerName(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, "_");
}

export function mapCadLayerToMcaKey(cadName: string): string | null {
  const n = normalizeCadLayerName(cadName);
  return CAD_LAYER_TO_MCA[n] ?? null;
}

export function isFeatureCollection(v: unknown): v is FeatureCollection {
  return (
    typeof v === "object" &&
    v !== null &&
    (v as FeatureCollection).type === "FeatureCollection" &&
    Array.isArray((v as FeatureCollection).features)
  );
}

/**
 * Aceita `{ layers: { CAD_NAME: FC } }` ou FC com `properties.layer` / `properties.Layer`.
 */
export function parseLayersImportPayload(body: unknown): Record<string, FeatureCollection> {
  const out: Record<string, FeatureCollection> = {};
  if (!body || typeof body !== "object") return out;

  const raw = body as Record<string, unknown>;

  if (raw.layers && typeof raw.layers === "object") {
    for (const [cadName, fc] of Object.entries(raw.layers as Record<string, unknown>)) {
      if (!isFeatureCollection(fc)) continue;
      const key = mapCadLayerToMcaKey(cadName) ?? normalizeCadLayerName(cadName);
      mergeInto(out, key, fc);
    }
    return out;
  }

  if (isFeatureCollection(raw)) {
    for (const f of raw.features) {
      const layerName =
        (f.properties?.layer as string) ??
        (f.properties?.Layer as string) ??
        (f.properties?.LAYER as string);
      if (!layerName) continue;
      const key = mapCadLayerToMcaKey(layerName) ?? normalizeCadLayerName(layerName);
      mergeInto(out, key, featureCollection([f as Feature]));
    }
  }

  return out;
}

function mergeInto(
  target: Record<string, FeatureCollection>,
  key: string,
  fc: FeatureCollection,
): void {
  if (!fc.features.length) return;
  const prev = target[key];
  if (!prev) {
    target[key] = fc;
    return;
  }
  target[key] = featureCollection([...prev.features, ...fc.features]);
}
