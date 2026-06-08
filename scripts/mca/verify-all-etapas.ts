/**
 * Verifica E01–E15 com debugger offline + actualiza debug-reports.
 * Uso: npm run mca:verify-all-etapas
 */
import fs from "node:fs";
import path from "node:path";
import { buildMcaLayoutPdf } from "../../src/lib/mca/layout-pdf";
import {
  etapaChecksPass,
  layerAreasFromMap,
  verifyEtapa01,
  verifyEtapa02,
  verifyEtapa03,
  verifyEtapa04,
  verifyEtapa05,
  verifyEtapaWithLayerAreas,
  type EtapaCheck,
} from "../../src/lib/mca/debug";
import { buildLayoutJson, layoutJsonChecksPass } from "../../src/lib/mca/layout/build-layout-json";
import { getInvalidatedLayerKeys } from "../../src/lib/mca/behavior/invalidation";
import { loadBehaviorRegistry } from "../../src/lib/mca/behavior/load-behavior-registry";
import { buildReviewItemsFromPipeline, reviewsReadyForExport } from "../../src/lib/mca/review/review-queue";
import { knowledgeDownstream } from "../../src/lib/mca/knowledge/relations";
import { resolveScaleProfile } from "../../src/lib/mca/scale/scale-manager";
import { runOfflinePipeline } from "../../src/lib/mca/pipeline-offline";

const DATE = new Date().toISOString().slice(0, 10);

function runEtapa(etapa: number, checks: EtapaCheck[]): boolean {
  const label = `E${String(etapa).padStart(2, "0")}`;
  const pass = etapaChecksPass(checks);
  for (const c of checks) {
    console.log(`${pass ? "PASS" : "FAIL"} ${label} · ${c.id}: ${c.detail}`);
  }
  if (!pass) {
    console.error(`\n${label} FAIL — debugger não passou.`);
    return false;
  }
  writePassReport(etapa, checks);
  return true;
}

function writePassReport(etapa: number, checks: EtapaCheck[], extra?: string[]) {
  const label = `E${String(etapa).padStart(2, "0")}`;
  const names: Record<number, string> = {
    1: "Especificação Pimenta",
    2: "Infraestrutura + health",
    3: "Registry + DAG",
    4: "UI wizard + projetos",
    5: "Perímetro + CRS",
    6: "DWG / import layers",
    7: "Fundiário",
    8: "Hidrografia",
    9: "Uso e ocupação",
    10: "APP + Reserva Legal",
    11: "Infraestrutura mapa",
    12: "Layout cartográfico",
    13: "PDF técnico",
    14: "IA (rascunho)",
    15: "CAD + release v1",
  };
  const lines = [
    `# ${label} — ${names[etapa] ?? "MCA"}`,
    "",
    `- Data: ${DATE}`,
    `- Debugger: \`npm run mca:verify-all-etapas\` → **PASS**`,
    "",
    "## Checks",
    "",
    ...checks.map((c) => `- [x] \`${c.id}\`: ${c.detail}`),
  ];
  if (extra?.length) {
    lines.push("", "## Notas", "", ...extra.map((l) => `- ${l}`));
  }
  const out = path.join(process.cwd(), "docs/mca/debug-reports", `${label}-pass.md`);
  fs.writeFileSync(out, lines.join("\n") + "\n");
}

async function main() {
  console.log("=== MCA verify-all-etapas (E01–E15) ===\n");

  if (!runEtapa(1, verifyEtapa01())) process.exit(1);
  if (!runEtapa(2, verifyEtapa02())) process.exit(1);
  if (!runEtapa(3, verifyEtapa03())) process.exit(1);
  if (!runEtapa(4, verifyEtapa04())) process.exit(1);

  const { project, layers, runs, jobId, layerAreas } = await runOfflinePipeline();
  const areas = layerAreasFromMap(layers);

  if (!runEtapa(5, verifyEtapa05(project))) process.exit(1);

  for (const etapa of [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    if (!runEtapa(etapa, verifyEtapaWithLayerAreas(etapa, project, areas))) process.exit(1);
  }

  const pdf = await buildMcaLayoutPdf(
    { ...project, id: "offline" },
    {
      layers: Object.fromEntries(layers),
    },
  );
  if (pdf.length < 500) {
    console.error("FAIL E13 PDF: buffer demasiado pequeno");
    process.exit(1);
  }
  console.log(`PASS E13 · pdf_buffer: ${pdf.length} bytes`);

  const iaRuns = runs.filter((r) =>
    ["MCA_Uso_IA_Prior_MapBiomas", "MCA_Uso_Segment_SAM"].includes(r.agentId),
  );
  const iaOk = iaRuns.every((r) => r.status === "pass" || r.status === "skipped");
  if (!iaOk) {
    console.error("FAIL E14: agentes IA crasharam");
    process.exit(1);
  }
  console.log(`PASS E14 · ia_agents: ${iaRuns.length} ok`);

  if (!project.layoutJson || !layoutJsonChecksPass(project.layoutJson)) {
    console.error("FAIL E12 layoutJson v2");
    process.exit(1);
  }
  console.log(
    `PASS E12 · layoutJson v2: ${project.layoutJson.layerOrder.length} layers · ${project.layoutJson.semanticLayers.length} semantic`,
  );

  const inv = getInvalidatedLayerKeys(["HYD_CORREGO"]);
  if (!inv.has("AMB_APP")) {
    console.error("FAIL v2 invalidation graph");
    process.exit(1);
  }
  console.log(`PASS v2 · invalidation: HYD_CORREGO → ${[...inv].slice(0, 4).join(", ")}`);

  const behaviorCount = Object.keys(loadBehaviorRegistry()).length;
  if (behaviorCount < 4) {
    console.error("FAIL v2 behavior_registry: entradas insuficientes");
    process.exit(1);
  }
  console.log(`PASS v2 · behavior_registry: ${behaviorCount} agentes`);

  const reviewItems = buildReviewItemsFromPipeline({ layers, runs });
  if (reviewItems.length < 2) {
    console.error("FAIL v2 review queue: poucos itens críticos");
    process.exit(1);
  }
  const mockReviews = reviewItems.map((r) => ({ ...r, projectId: "offline", uid: "offline" }));
  if (reviewsReadyForExport(mockReviews)) {
    console.error("FAIL v2 review gate: export deveria estar bloqueado");
    process.exit(1);
  }
  const approved = mockReviews.map((r) => ({ ...r, status: "approved" as const }));
  if (!reviewsReadyForExport(approved)) {
    console.error("FAIL v2 review gate: export deveria passar após aprovação");
    process.exit(1);
  }
  console.log(`PASS v2 · review queue: ${reviewItems.length} itens · gate OK`);

  const scale = resolveScaleProfile(project.meta.scale);
  if (scale.scaleDenominator !== 12_000) {
    console.error("FAIL v2 scale: perfil 12k esperado para Catingueiro");
    process.exit(1);
  }
  console.log(`PASS v2 · scale: ${scale.scale} · inset ${scale.insetScale}`);

  const topoInvalid = project.layoutJson!.spatialLayers.filter((s) => s.topologyStatus === "invalid");
  if (topoInvalid.length > 0) {
    console.error(`FAIL v2 topology: ${topoInvalid.length} layers inválidas`);
    process.exit(1);
  }
  console.log(`PASS v2 · topology: ${project.layoutJson!.spatialLayers.length} layers avaliadas`);

  const kg = knowledgeDownstream("HYD_CORREGO");
  if (!kg.includes("AMB_APP")) {
    console.error("FAIL v2 knowledge graph");
    process.exit(1);
  }
  console.log(`PASS v2 · knowledge: HYD_CORREGO → ${kg.slice(0, 3).join(", ")}`);

  console.log(
    `\n=== MCA E01–E15 PASS ===\n` +
      `Pipeline offline: ${runs.length} agentes · ${layers.size} layers · job ${jobId.slice(0, 8)}…\n` +
      `Nota final: ${project.scores?.final?.toFixed(1) ?? "—"}\n` +
      `Relatórios: docs/mca/debug-reports/E01-pass.md … E15-pass.md`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
