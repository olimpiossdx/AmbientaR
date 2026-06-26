import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyBearerUid } from "@/lib/study-maps/verify-user";
import { studyMapsAdminDb, studyMapsAdminStorage } from "@/lib/study-maps/admin";
import { firebaseConfig } from "@/firebase/config";
import {
  extractIntersectGeometry,
  searchSentinel2Preview,
} from "@/lib/study-maps/stac-sentinel";

export const maxDuration = 300;

const COL = "study_map_export_jobs";

function isGeoJsonLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.type === "FeatureCollection" && Array.isArray(o.features)) return true;
  if (o.type === "Feature" && o.geometry) return true;
  if (
    typeof o.type === "string" &&
    ["Polygon", "MultiPolygon"].includes(o.type) &&
    o.coordinates
  )
    return true;
  return false;
}

type ExportPostBody = {
  geojson?: unknown;
  projectTitle?: string;
  fetchOsm?: boolean;
  targetCrs?: string;
};

export async function POST(req: NextRequest) {
  let jobId: string | undefined;
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json()) as ExportPostBody;
    if (!isGeoJsonLike(body.geojson)) {
      return NextResponse.json(
        { success: false, error: "Envie um objeto GeoJSON (Feature, FeatureCollection ou Polygon)." },
        { status: 400 },
      );
    }

    const jobIdValue = crypto.randomUUID();
    jobId = jobIdValue;
    const projectTitle =
      typeof body.projectTitle === "string" && body.projectTitle.trim()
        ? body.projectTitle.trim().slice(0, 200)
        : "Mapa sem título";
    const fetchOsm = Boolean(body.fetchOsm);
    const targetCrs =
      typeof body.targetCrs === "string" && body.targetCrs.startsWith("EPSG:")
        ? body.targetCrs
        : "EPSG:31983";

    const bucketName = firebaseConfig.storageBucket!;
    const inputPath = `study_maps_exports/${user.uid}/${jobIdValue}/input.geojson`;
    const outputPrefix = `study_maps_exports/${user.uid}`;

    const bucket = studyMapsAdminStorage().bucket(bucketName);
    const file = bucket.file(inputPath);
    await file.save(JSON.stringify(body.geojson), {
      contentType: "application/geo+json",
      resumable: false,
    });

    const db = studyMapsAdminDb();
    const jobRef = db.collection(COL).doc(jobIdValue);

    let stacPreview: Awaited<ReturnType<typeof searchSentinel2Preview>> = [];
    const geom = extractIntersectGeometry(body.geojson);
    if (geom) {
      try {
        stacPreview = await searchSentinel2Preview(geom);
      } catch {
        stacPreview = [];
      }
    }

    await jobRef.set({
      uid: user.uid,
      projectTitle,
      status: "running",
      fetchOsm,
      targetCrs,
      stacPreview,
      createdAt: FieldValue.serverTimestamp(),
    });

    const workerUrl = process.env.GEO_EXPORT_WORKER_URL?.replace(/\/$/, "");
    const workerSecret = process.env.WORKER_SHARED_SECRET;

    if (!workerUrl || !workerSecret) {
      await jobRef.update({
        status: "error",
        finishedAt: FieldValue.serverTimestamp(),
        errorMessage:
          "GEO_EXPORT_WORKER_URL ou WORKER_SHARED_SECRET não configurados no servidor.",
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Exportação geográfica não está configurada no servidor (worker).",
          jobId,
        },
        { status: 503 },
      );
    }

    const inputGcsUri = `gs://${bucketName}/${inputPath}`;
    const outputGcsPrefix = `gs://${bucketName}/${outputPrefix}/`;

    const wr = await fetch(`${workerUrl}/v1/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": workerSecret,
      },
      body: JSON.stringify({
        job_id: jobIdValue,
        input_gcs_uri: inputGcsUri,
        output_gcs_prefix: outputGcsPrefix,
        fetch_osm: fetchOsm,
        target_crs: targetCrs,
      }),
    });

    const workerJson = (await wr.json()) as {
      ok?: boolean;
      artifacts?: { name: string; gcs_uri: string }[];
      osm_warning?: string | null;
      detail?: string;
    };

    if (!wr.ok || !workerJson.ok) {
      const msg =
        typeof workerJson.detail === "string"
          ? workerJson.detail
          : `Worker HTTP ${wr.status}`;
      await jobRef.update({
        status: "error",
        finishedAt: FieldValue.serverTimestamp(),
        errorMessage: msg,
      });
      return NextResponse.json(
        { success: false, error: msg, jobId },
        { status: 502 },
      );
    }

    const artifactUrls: Record<string, string> = {};
    const expires = Date.now() + 60 * 60 * 1000;
    for (const a of workerJson.artifacts ?? []) {
      const m = /^gs:\/\/([^/]+)\/(.+)$/.exec(a.gcs_uri);
      if (!m) continue;
      const [, b, key] = m;
      const [signed] = await studyMapsAdminStorage()
        .bucket(b)
        .file(key)
        .getSignedUrl({
          action: "read",
          expires,
        });
      artifactUrls[a.name] = signed;
    }

    await jobRef.update({
      status: "done",
      finishedAt: FieldValue.serverTimestamp(),
      artifactUrls,
      osmWarning: workerJson.osm_warning ?? null,
    });

    return NextResponse.json({
      success: true,
      jobId,
      artifactUrls,
      osmWarning: workerJson.osm_warning ?? null,
      stacPreview,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido.";
    const status = msg.includes("Token") ? 401 : 500;
    return NextResponse.json(
      {
        success: false,
        error: msg,
        ...(jobId ? { jobId, partial: true } : {}),
      },
      { status },
    );
  }
}
