import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { firebaseConfig } from "@/firebase/config";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import { studyMapsAdminDb, studyMapsAdminStorage } from "@/lib/study-maps/admin";

const COL = "mca_projects";
const MAX_BYTES = 80 * 1024 * 1024;

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

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Ficheiro em falta." }, { status: 400 });
    }

    const name = file.name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120);
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (!["dwg", "dxf", "zip"].includes(ext)) {
      return NextResponse.json(
        { success: false, error: "Use .dwg, .dxf ou .zip (layers exportados)." },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "Ficheiro demasiado grande (máx. 80 MB)." }, { status: 400 });
    }

    const bucketName = firebaseConfig.storageBucket!;
    const objectPath = `mca-dwg/${user.uid}/${params.id}/${Date.now()}-${name}`;
    const bucket = studyMapsAdminStorage().bucket(bucketName);
    await bucket.file(objectPath).save(bytes, {
      contentType: file.type || "application/octet-stream",
      metadata: { metadata: { uploadedBy: user.uid, projectId: params.id } },
    });

    await studyMapsAdminDb()
      .collection(COL)
      .doc(params.id)
      .update({
        dwgGcsPath: `gs://${bucketName}/${objectPath}`,
        updatedAt: FieldValue.serverTimestamp(),
        "meta.dwgFileName": name,
      });

    return NextResponse.json({
      success: true,
      dwgGcsPath: `gs://${bucketName}/${objectPath}`,
      fileName: name,
      note:
        ext === "dwg" || ext === "dxf"
          ? "DWG guardado. Importe também GeoJSON por layer (export CAD) para geometrias imediatas."
          : "Arquivo guardado.",
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro no upload" },
      { status: 500 },
    );
  }
}
