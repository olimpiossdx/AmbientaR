import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import {
  convertDwgFromGcs,
  isCadWorkerConfigured,
  isOgr2ogrAvailable,
} from "@/lib/mca/dwg-convert";
import { persistAgentLayers } from "@/lib/mca/persist-layer";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import type { FeatureCollection } from "geojson";

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
        { success: false, error: "Faça upload de DWG/DXF primeiro." },
        { status: 400 },
      );
    }

    const converted = await convertDwgFromGcs(project.dwgGcsPath);
    if (!converted.ok) {
      return NextResponse.json(
        {
          success: false,
          error: converted.message,
          ogrAvailable: converted.ogrAvailable,
          hint: isOgr2ogrAvailable()
            ? "Tente exportar layers do CAD para GeoJSON e use import-layers."
            : isCadWorkerConfigured()
              ? "Worker configurado mas falhou — verifique deploy geo-export com /v1/cad/ingest."
              : "Instale GDAL localmente ou configure GEO_EXPORT_WORKER_URL + WORKER_SHARED_SECRET.",
        },
        { status: converted.ogrAvailable ? 422 : 503 },
      );
    }

    const map = new Map<string, FeatureCollection>();
    for (const [k, fc] of Object.entries(converted.layers)) {
      map.set(k, fc);
    }
    await persistAgentLayers(params.id, map, "MCA_Learn_DWG_Ingest");

    await studyMapsAdminDb()
      .collection("mca_projects")
      .doc(params.id)
      .update({
        "meta.importedLayerKeys": converted.layerKeys,
        "meta.dwgConvertedAt": new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      imported: converted.layerKeys.length,
      layerKeys: converted.layerKeys,
      message: converted.message,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Conversão falhou" },
      { status: 500 },
    );
  }
}
