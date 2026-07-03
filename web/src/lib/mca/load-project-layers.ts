import type { FeatureCollection } from "geojson";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

export async function loadMcaProjectLayers(
  projectId: string,
): Promise<Record<string, FeatureCollection>> {
  const snap = await studyMapsAdminDb()
    .collection("mca_projects")
    .doc(projectId)
    .collection("layers")
    .get();

  const layers: Record<string, FeatureCollection> = {};
  for (const doc of snap.docs) {
    const geo = doc.data().geojson;
    if (geo && typeof geo === "object" && (geo as FeatureCollection).features) {
      layers[doc.id] = geo as FeatureCollection;
    }
  }
  return layers;
}
