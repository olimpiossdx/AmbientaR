import type { DocumentData } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/study-maps/verify-user";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

const COL = "study_map_export_jobs";

function serialize(d: DocumentData, id: string) {
  const createdAt = d.createdAt?.toDate?.()?.toISOString?.() ?? null;
  const finishedAt = d.finishedAt?.toDate?.()?.toISOString?.() ?? null;
  return {
    jobId: id,
    uid: d.uid,
    projectTitle: d.projectTitle,
    status: d.status,
    fetchOsm: d.fetchOsm,
    targetCrs: d.targetCrs,
    createdAt,
    finishedAt,
    errorMessage: d.errorMessage,
    artifactUrls: d.artifactUrls,
    osmWarning: d.osmWarning ?? null,
    stacPreview: d.stacPreview ?? [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const snap = await studyMapsAdminDb()
      .collection(COL)
      .where("uid", "==", user.uid)
      .limit(30)
      .get();

    const jobs = snap.docs.map((doc) => serialize(doc.data(), doc.id));
    jobs.sort((a, b) => {
      const ta = a.createdAt ?? "";
      const tb = b.createdAt ?? "";
      return tb.localeCompare(ta);
    });

    return NextResponse.json({ success: true, jobs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido.";
    const status = msg.includes("Token") ? 401 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
