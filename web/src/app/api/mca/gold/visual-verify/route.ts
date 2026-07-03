import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { buildMcaLayoutPdf } from "@/lib/mca/layout-pdf";
import { loadGoldManifest } from "@/lib/mca/gold-manifest";
import type { McaGoldPresetId } from "@/lib/mca/gold-presets";
import {
  extractPdfText,
  goldVisualChecksPass,
  runGoldVisualChecks,
} from "@/lib/mca/gold-visual-checks";
import { runOfflinePipeline } from "@/lib/mca/pipeline-offline";

export const maxDuration = 120;

const ALLOWED: McaGoldPresetId[] = [
  "gold_catingueiro",
  "gold_palmeiras",
  "gold_mangabeiras",
];

/** Benchmark visual v4 offline (pipeline Catingueiro + checklist manifest). */
export async function POST(req: NextRequest) {
  try {
    await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json().catch(() => ({}))) as { presetId?: string };
    const presetId = (body.presetId ?? "gold_catingueiro") as McaGoldPresetId;

    if (!ALLOWED.includes(presetId)) {
      return NextResponse.json({ success: false, error: "presetId inválido." }, { status: 400 });
    }

    if (presetId !== "gold_catingueiro") {
      return NextResponse.json(
        {
          success: false,
          error: "Benchmark visual v4 offline disponível apenas para gold_catingueiro.",
        },
        { status: 422 },
      );
    }

    const manifest = loadGoldManifest(presetId);
    if (!manifest) {
      return NextResponse.json({ success: false, error: "Manifest em falta." }, { status: 404 });
    }

    const { project, layers } = await runOfflinePipeline();
    const pdf = buildMcaLayoutPdf(
      { ...project, id: `gold-${presetId}` },
      { layers: Object.fromEntries(layers) },
    );
    const pdfText = await extractPdfText(pdf);
    const checks = runGoldVisualChecks({
      project,
      layers,
      pdf,
      manifest,
      pdfText,
    });

    return NextResponse.json({
      success: true,
      presetId,
      autoPass: goldVisualChecksPass(checks),
      pdfBytes: pdf.length,
      checks,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
