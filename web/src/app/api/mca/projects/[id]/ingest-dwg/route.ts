import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { convertDwgFromGcs, isOgr2ogrAvailable } from "@/lib/mca/dwg-convert";
import { parseLayersImportPayload } from "@/lib/mca/layer-import";
import { persistAgentLayers } from "@/lib/mca/persist-layer";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { firebaseConfig } from "@/firebase/config";
import type { FeatureCollection } from "geojson";

/**
 * Tenta extrair layers de DWG no GCS via ogr2ogr (se disponível no servidor).
 * Fallback: importar GeoJSON layers manualmente na UI.
 */
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
    if (!project.dwgGcsPath) {
      return NextResponse.json(
        {
          success: false,
          error: "Sem DWG no projeto. Faça upload na aba Projeto ou importe GeoJSON layers.",
        },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { geojsonBundle?: unknown };
    if (body.geojsonBundle) {
      const layers = parseLayersImportPayload(body.geojsonBundle);
      const map = new Map<string, FeatureCollection>();
      for (const [k, fc] of Object.entries(layers)) map.set(k, fc);
      await persistAgentLayers(params.id, map, "MCA_Learn_DWG_Ingest");
      await studyMapsAdminDb()
        .collection("mca_projects")
        .doc(params.id)
        .update({
          "meta.importedLayerKeys": Object.keys(layers),
        });
      return NextResponse.json({
        success: true,
        imported: Object.keys(layers).length,
        layerKeys: Object.keys(layers),
        via: "geojson_bundle",
      });
    }

    const gsMatch = project.dwgGcsPath.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!gsMatch) {
      return NextResponse.json({ success: false, error: "dwgGcsPath inválido." }, { status: 400 });
    }

    if (isOgr2ogrAvailable()) {
      const converted = await convertDwgFromGcs(project.dwgGcsPath);
      if (converted.ok) {
        const map = new Map<string, FeatureCollection>();
        for (const [k, fc] of Object.entries(converted.layers)) map.set(k, fc);
        await persistAgentLayers(params.id, map, "MCA_Learn_DWG_Ingest");
        await studyMapsAdminDb()
          .collection("mca_projects")
          .doc(params.id)
          .update({
            "meta.importedLayerKeys": converted.layerKeys,
            "meta.dwgConvertedAt": new Date().toISOString(),
          });
        return NextResponse.json({
          success: true,
          imported: converted.layerKeys.length,
          layerKeys: converted.layerKeys,
          via: "ogr2ogr",
          message: converted.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      dwgGcsPath: project.dwgGcsPath,
      ogrAvailable: isOgr2ogrAvailable(),
      note:
        "Conversão automática indisponível ou sem layers. Exporte do CAD para GeoJSON e use import-layers ou POST com geojsonBundle.",
      bucket: gsMatch[1],
      object: gsMatch[2],
      bucketPublic: firebaseConfig.storageBucket,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
