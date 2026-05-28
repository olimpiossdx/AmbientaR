import { FieldValue } from "firebase-admin/firestore";
import type { FeatureCollection } from "geojson";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { geojsonChecksum } from "./checksum";
import type { McaAgentResult } from "./types";

const PROJECTS = "mca_projects";

function hasFeatures(fc: FeatureCollection | undefined): boolean {
  return Boolean(fc?.features?.length);
}

export async function persistAgentLayer(
  projectId: string,
  result: McaAgentResult,
): Promise<void> {
  if (!result.geojson || !result.layerKey || !hasFeatures(result.geojson)) return;
  await studyMapsAdminDb()
    .collection(PROJECTS)
    .doc(projectId)
    .collection("layers")
    .doc(result.layerKey)
    .set({
      geojson: result.geojson,
      layerKey: result.layerKey,
      agentId: result.agentId,
      checksum: geojsonChecksum(result.geojson),
      sourceAgentId: result.agentId,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function persistAgentLayers(
  projectId: string,
  layers: Map<string, FeatureCollection>,
  sourceAgentId = "MCA_Pipeline",
): Promise<void> {
  const batch = studyMapsAdminDb().batch();
  const ref = studyMapsAdminDb().collection(PROJECTS).doc(projectId);
  for (const [layerKey, geojson] of layers) {
    if (!geojson?.features?.length) continue;
    batch.set(ref.collection("layers").doc(layerKey), {
      geojson,
      layerKey,
      agentId: sourceAgentId,
      checksum: geojsonChecksum(geojson),
      sourceAgentId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}
