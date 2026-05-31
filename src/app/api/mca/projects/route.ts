import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { defaultEtapaStatus } from "@/lib/mca/etapas";
import { toMcaProjectListItem } from "@/lib/mca/project-list-item";
import type { McaProjectDoc, McaProjectMeta } from "@/lib/mca/types";

const COL = "mca_projects";

const LIST_SELECT = [
  "title",
  "currentEtapa",
  "etapaStatus",
  "meta",
  "createdAt",
  "updatedAt",
] as const;

export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const snap = await studyMapsAdminDb()
      .collection(COL)
      .where("uid", "==", user.uid)
      .select(...LIST_SELECT)
      .limit(30)
      .get();
    const projects = snap.docs.map((d) =>
      toMcaProjectListItem(d.id, d.data() as McaProjectDoc),
    );
    return NextResponse.json({ success: true, projects });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 401 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json()) as {
      title?: string;
      meta?: McaProjectMeta;
      perimeterGeoJson?: McaProjectDoc["perimeterGeoJson"];
    };
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 200)
        : "Projeto MCA";
    const ref = studyMapsAdminDb().collection(COL).doc();
    const doc: McaProjectDoc = {
      uid: user.uid,
      title,
      meta: {
        crs: "EPSG:31983",
        scale: "1:12.000",
        templateId: "pimenta_uso_ocupacao",
        technicalResponsible: "Elaine de Sales Fernandes",
        crea: "CREA-MG 144.093/D",
        municipality: "Unaí-MG",
        comarca: "Unaí-MG",
        cartorio: "CNS 06.151-5",
        ...body.meta,
      },
      perimeterGeoJson: body.perimeterGeoJson,
      currentEtapa: 4,
      etapaStatus: defaultEtapaStatus(4),
      createdAt: new Date().toISOString(),
    };
    await ref.set({
      ...doc,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, projectId: ref.id });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 400 },
    );
  }
}
