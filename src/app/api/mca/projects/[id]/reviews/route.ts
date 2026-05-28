import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { loadMcaProject } from "@/lib/mca/orchestrator";
import {
  listProjectReviews,
  reviewsReadyForExport,
  updateReviewStatus,
  type McaReviewStatus,
} from "@/lib/mca/review/review-queue";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }
    const reviews = await listProjectReviews(params.id, user.uid);
    return NextResponse.json({
      success: true,
      reviews,
      exportReady: reviewsReadyForExport(reviews),
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const project = await loadMcaProject(params.id, user.uid);
    if (!project) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }
    const body = (await req.json()) as { reviewId?: string; status?: McaReviewStatus };
    if (!body.reviewId || !body.status) {
      return NextResponse.json({ success: false, error: "reviewId e status obrigatórios." }, { status: 400 });
    }
    await updateReviewStatus({
      reviewId: body.reviewId,
      uid: user.uid,
      status: body.status,
      reviewerUid: user.uid,
    });
    const reviews = await listProjectReviews(params.id, user.uid);
    return NextResponse.json({
      success: true,
      exportReady: reviewsReadyForExport(reviews),
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 400 },
    );
  }
}
