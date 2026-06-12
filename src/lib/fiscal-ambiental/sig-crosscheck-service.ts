import type { GeoJSON } from "geojson";
import { isFadSigCrosscheckEnabled } from "@/lib/deploy-flags";
import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import {
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  IBAMA_EMBARGOS_LAYER_ID,
} from "@/lib/geospatial/wave-federal-catalog";
import {
  isEmbargosLayer,
  isMapBiomasAlertaLayer,
  isProdesLayer,
} from "@/lib/geospatial/ibama-embargos";
import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import { adminDb } from "@/lib/firebase-admin";
import { severityFromAreaHa } from "./fiscal-finding-labels";
import type { FadFiscalFinding, FadFiscalFindingType, FadFiscalSeverity } from "./types";

const FINDINGS_SUB = "fiscal_findings";

const FAD_SIG_LAYER_IDS = [
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  IBAMA_EMBARGOS_LAYER_ID,
] as const;

function findingsCol(workspaceId: string) {
  return adminDb().collection("fad_workspaces").doc(workspaceId).collection(FINDINGS_SUB);
}

function layerAreaHa(layer: GeoLayerResult): number {
  return layer.stats.reduce((sum, row) => sum + (row.areaHa ?? 0), 0);
}

function layerFeatureCount(layer: GeoLayerResult): number {
  if (layer.stats.length === 0) return 0;
  return layer.stats.reduce((sum, row) => sum + (row.count ?? 1), 0);
}

function findingTypeForLayer(layerId: string): FadFiscalFindingType {
  if (isEmbargosLayer(layerId)) return "app_intervention";
  return "vegetation_loss";
}

function severityForLayer(layerId: string, areaHa: number): FadFiscalSeverity {
  if (isEmbargosLayer(layerId)) return areaHa >= 1 ? "high" : "medium";
  if (isProdesLayer(layerId) || isMapBiomasAlertaLayer(layerId)) {
    return severityFromAreaHa(areaHa);
  }
  return severityFromAreaHa(areaHa);
}

function titleForLayer(layer: GeoLayerResult): string {
  if (isEmbargosLayer(layer.layerId)) {
    return "Embargo IBAMA no perímetro";
  }
  if (isProdesLayer(layer.layerId)) {
    return `Coincidência PRODES — ${layer.title}`;
  }
  if (isMapBiomasAlertaLayer(layer.layerId)) {
    return `Alerta MapBiomas — ${layer.title}`;
  }
  return `Cruzamento SIG — ${layer.title}`;
}

async function deleteOpenSigFindings(workspaceId: string) {
  const snap = await findingsCol(workspaceId)
    .where("source", "==", "sig_crosscheck")
    .where("status", "==", "open")
    .get();
  if (snap.empty) return;
  const batch = adminDb().batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export type SigCrosscheckResult = {
  created: number;
  findings: FadFiscalFinding[];
  prodesAlerts: number;
  layersQueried: number;
};

export async function runSigCrosscheck(params: {
  workspaceId: string;
  ownerId: string;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}): Promise<SigCrosscheckResult> {
  if (!isFadSigCrosscheckEnabled()) {
    return { created: 0, findings: [], prodesAlerts: 0, layersQueried: 0 };
  }

  const analysis = await runWaveAAnalysis(
    {
      dataType: "polygon",
      data: JSON.stringify(params.aoi),
    },
    undefined,
    undefined,
    { layerIds: [...FAD_SIG_LAYER_IDS] },
  );

  const hits = analysis.layers.filter(
    (layer) => layer.status === "ok" && layer.stats.length > 0 && layerFeatureCount(layer) > 0,
  );

  await deleteOpenSigFindings(params.workspaceId);

  const created: FadFiscalFinding[] = [];
  const now = new Date().toISOString();
  let prodesAlerts = 0;

  for (const layer of hits) {
    const areaHa = Math.round(layerAreaHa(layer) * 100) / 100;
    const count = layerFeatureCount(layer);
    if (isProdesLayer(layer.layerId) || isMapBiomasAlertaLayer(layer.layerId)) {
      prodesAlerts += count;
    }

    const ref = findingsCol(params.workspaceId).doc();
    const finding: Omit<FadFiscalFinding, "id"> = {
      workspaceId: params.workspaceId,
      ownerId: params.ownerId,
      type: findingTypeForLayer(layer.layerId),
      severity: severityForLayer(layer.layerId, areaHa),
      status: "open",
      title: titleForLayer(layer),
      description:
        `${layer.summary} ` +
        `(${count} feição(ões), ~${areaHa.toFixed(2)} ha no recorte). ` +
        "Fonte: bases públicas via motor SIG AmbientaR — confirme em campo e nos portais oficiais.",
      areaHa: areaHa > 0 ? areaHa : undefined,
      confidence: 0.85,
      source: "sig_crosscheck",
      dedupKey: `sig:${layer.layerId}`,
      createdAt: now,
      createdBy: params.ownerId,
      updatedAt: now,
      updatedBy: params.ownerId,
    };

    await ref.set(finding);
    created.push({ id: ref.id, ...finding });
  }

  return {
    created: created.length,
    findings: created,
    prodesAlerts,
    layersQueried: analysis.layers.length,
  };
}
