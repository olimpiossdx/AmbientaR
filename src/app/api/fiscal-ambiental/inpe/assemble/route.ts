import { NextResponse } from "next/server";
import { assembleMosaicForDate } from "@/lib/fiscal-ambiental/assemble-service";
import { requireFadWorkspaceAccess } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

export const maxDuration = 300;

const PROGRESS_MESSAGES = [
  "A procurar imagem no INPE…",
  "Imagem encontrada · a obter bandas…",
  "A melhorar resolução (fusão automática)…",
  "A recortar na sua propriedade…",
  "A preparar visualização…",
  "Pronto",
];

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as { workspaceId?: string; date?: string };
    const workspaceId = body.workspaceId?.trim();
    const date = body.date?.trim();
    if (!workspaceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_BODY", message: "workspaceId e date (YYYY-MM-DD) são obrigatórios." },
        },
        { status: 400 },
      );
    }

    const workspace = await requireFadWorkspaceAccess(
      workspaceId,
      user.uid,
      user.role === "admin",
    );

    const mosaic = await assembleMosaicForDate({
      workspaceId,
      ownerId: user.uid,
      aoi: workspace.aoi!,
      date,
    });

    return NextResponse.json({
      ok: true,
      data: {
        mosaic,
        progress: 100,
        currentStep: PROGRESS_MESSAGES[5],
      },
    });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    const message = err instanceof Error ? err.message : "Falha ao montar imagem.";
    return NextResponse.json(
      { ok: false, error: { code: "ASSEMBLE_FAILED", message } },
      { status: 502 },
    );
  }
}
