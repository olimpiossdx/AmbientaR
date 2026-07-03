import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type { FeatureCollection } from "geojson";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { geojsonChecksum } from "@/lib/mca/checksum";
import { parseLayersImportPayload } from "@/lib/mca/layer-import";
import { fitLayersToPerimeter } from "@/lib/mca/layer-fit";
import { toFeatureCollection } from "@/lib/mca/perimeter";
import { getInvalidatedLayerKeys } from "@/lib/mca/behavior/invalidation";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

const COL = "mca_projects";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }

    let body: unknown;
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ success: false, error: "JSON ou ficheiro em falta." }, { status: 400 });
      }
      body = JSON.parse(await file.text());
    }

    let layers = parseLayersImportPayload(body);
    const perim = toFeatureCollection(project.perimeterGeoJson);
    if (perim?.features?.length) {
      layers = fitLayersToPerimeter(layers, perim);
    }
    const keys = Object.keys(layers);
    if (!keys.length) {
      return NextResponse.json(
        { success: false, error: "Nenhuma layer reconhecida. Use { layers: { LAVOURA: FeatureCollection } }." },
        { status: 400 },
      );
    }

    const batch = studyMapsAdminDb().batch();
    const projectRef = studyMapsAdminDb().collection(COL).doc(params.id);
    let saved = 0;
    const importedKeys: string[] = [];

    for (const [layerKey, fc] of Object.entries(layers)) {
      if (!fc.features?.length) continue;
      const checksum = geojsonChecksum(fc);
      batch.set(projectRef.collection("layers").doc(layerKey), {
        geojson: fc as FeatureCollection,
        layerKey,
        checksum,
        source: "import",
        updatedAt: FieldValue.serverTimestamp(),
      });
      saved++;
      importedKeys.push(layerKey);
    }

    const stale = getInvalidatedLayerKeys(importedKeys);
    for (const key of stale) {
      if (importedKeys.includes(key)) continue;
      batch.delete(projectRef.collection("layers").doc(key));
    }

    batch.update(projectRef, {
      "meta.importedLayerKeys": keys,
      "meta.lastImportAt": new Date().toISOString(),
      "meta.invalidatedLayerKeys": [...stale],
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      imported: saved,
      layerKeys: keys,
      invalidatedLayerKeys: [...stale],
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro na importação" },
      { status: 400 },
    );
  }
}
