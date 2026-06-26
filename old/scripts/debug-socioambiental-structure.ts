/**
 * Debugger estrutural — Extrato Socioambiental (sem rede, sem Firebase).
 * Valida inventário, catálogo, camadas, wizard, veredito, regras e integrações.
 *
 * Uso: npx tsx scripts/debug-socioambiental-structure.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAllLayersForBbox } from "@/lib/geospatial/geo-all-layers";
import {
  SOCIOAMBIENTAL_REPORT_BLOCKS,
  getBlocksForBiomaPreset,
} from "@/lib/socioambiental/report-blocks-catalog";
import {
  SOCIOAMBIENTAL_CRITERIA_CATALOG,
  countCriteriaForBlocks,
  resolveActiveCriteria,
  resolveLayerIdsForBlocks,
  type SocioambientalReportBlockId,
} from "@/lib/socioambiental/socioambiental-criteria-catalog";
import {
  createDefaultWizardState,
  WIZARD_STEP_LABELS,
  blocksForPreset,
  MODO_RELATORIO_OPTIONS,
} from "@/lib/socioambiental/socioambiental-wizard-state";
import {
  computeResumoCriterios,
  computeVereditoGlobal,
} from "@/lib/socioambiental/veredito-socioambiental";
import { needsRiscoPorGeometria } from "@/lib/socioambiental/risco-por-geometria";
import type { ModoRelatorioSocioambiental } from "@/lib/types/analise-socioambiental";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let passed = 0;
let failed = 0;
const warnings: string[] = [];

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`✓ ${label}`);
    passed += 1;
  } else {
    console.log(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function warn(msg: string) {
  warnings.push(msg);
  console.log(`⚠ ${msg}`);
}

/** Ficheiros esperados na estrutura do módulo. */
const EXPECTED_FILES = [
  // Tipos
  "src/lib/types/analise-socioambiental.ts",
  // Lib core
  "src/lib/socioambiental/socioambiental-criteria-catalog.ts",
  "src/lib/socioambiental/report-blocks-catalog.ts",
  "src/lib/socioambiental/socioambiental-wizard-state.ts",
  "src/lib/socioambiental/regras-criterio.ts",
  "src/lib/socioambiental/map-layers-to-criterios.ts",
  "src/lib/socioambiental/socioambiental-spatial-enrich.ts",
  "src/lib/socioambiental/veredito-socioambiental.ts",
  "src/lib/socioambiental/criterio-resultado-display.ts",
  "src/lib/socioambiental/socioambiental-semaphore-map.ts",
  "src/lib/socioambiental/layer-semaphore-from-criterios.ts",
  "src/lib/socioambiental/risco-por-geometria.ts",
  "src/lib/socioambiental/risco-pdf-tables.ts",
  "src/lib/socioambiental/merge-relatorio.ts",
  "src/lib/socioambiental/export-socioambiental-pdf.ts",
  "src/lib/socioambiental/export-extrato-risco-pdf.ts",
  "src/lib/socioambiental/upload-socioambiental-pdf-externo.ts",
  // Listas agente
  "src/lib/socioambiental/listas-agente.server.ts",
  "src/lib/socioambiental/listas-agente-client.ts",
  "src/lib/socioambiental/listas-agente-parse.ts",
  "src/lib/socioambiental/listas-agente-types.ts",
  "src/lib/socioambiental/listas-agente-mte.server.ts",
  "src/lib/socioambiental/listas-agente-ibama.server.ts",
  "src/lib/socioambiental/listas-agente-icmbio.server.ts",
  "src/lib/socioambiental/listas-agente-reserva-legal.server.ts",
  "src/lib/socioambiental/listas-agente-cpr.server.ts",
  // Geoespacial
  "src/lib/geospatial/wave-socioambiental-catalog.ts",
  "src/lib/geospatial/car-snapshot-store.ts",
  "src/lib/geospatial/car-snapshot-compare.ts",
  // API
  "src/app/api/socioambiental/listas-agente/route.ts",
  // UI páginas
  "src/app/(app)/studies/analise-socioambiental/page.tsx",
  "src/app/(app)/studies/analise-socioambiental/socioambiental-executar-tab.tsx",
  "src/app/(app)/studies/analise-socioambiental/analise-socioambiental-form.tsx",
  "src/app/(app)/studies/analise-socioambiental/preencher-cliente-dialog.tsx",
  // Componentes
  "src/components/socioambiental/socioambiental-execucao-wizard.tsx",
  "src/components/socioambiental/socioambiental-report-picker.tsx",
  "src/components/socioambiental/risco-geometria-panel.tsx",
  "src/components/socioambiental/alertas-deduplicados-panel.tsx",
  // Docs
  "docs/EXTRATO-SOCIOAMBIENTAL-PLANO.md",
  "docs/EXTRATO-SOCIOAMBIENTAL-CRITERIOS.md",
  // Scripts debug
  "scripts/debug-socioambiental-fases.mjs",
  "scripts/debug-socioambiental-units.ts",
];

const LISTA_CRITERIO_IDS = [
  "mte_trabalho_escravo",
  "ibama_embargo_lista",
  "icmbio_embargo_lista",
  "ibama_autuacoes_lista",
  "reserva_legal_documento",
  "restricao_beneficiario_cpr",
] as const;

const MG_BBOX: [number, number, number, number] = [-46.5, -21.5, -43.5, -18.5];

console.log("=== Inventário de ficheiros ===\n");

const missingFiles = EXPECTED_FILES.filter((f) => !existsSync(join(ROOT, f)));
ok(`Ficheiros esperados (${EXPECTED_FILES.length})`, missingFiles.length === 0);
if (missingFiles.length) {
  for (const f of missingFiles) console.log(`  ausente: ${f}`);
}

console.log("\n=== Regras Firebase (storage + firestore) ===\n");

const storageRules = readFileSync(join(ROOT, "storage.rules"), "utf8");
const firestoreRules = readFileSync(
  join(ROOT, "src/firebase/rules/firestore.rules"),
  "utf8",
);
ok("storage.rules — path socioambiental/{userId}", /match \/socioambiental\/\{userId\}/.test(storageRules));
ok(
  "firestore.rules — analisesSocioambientais",
  /match \/analisesSocioambientais\/\{analysisId\}/.test(firestoreRules),
);

console.log("\n=== Navegação ===\n");

const navConfig = readFileSync(join(ROOT, "src/lib/navigation-config.ts"), "utf8");
ok(
  "navigation-config — rota /studies/analise-socioambiental",
  navConfig.includes('"/studies/analise-socioambiental"'),
);

console.log("\n=== Catálogo de critérios ===\n");

const ids = SOCIOAMBIENTAL_CRITERIA_CATALOG.map((c) => c.id);
const uniqueIds = new Set(ids);
ok("IDs únicos no catálogo", ids.length === uniqueIds.size);
ok("Catálogo não vazio", ids.length > 20, `total=${ids.length}`);

const validBlocks = new Set(
  SOCIOAMBIENTAL_REPORT_BLOCKS.map((b) => b.id),
);
const orphanBlocks = SOCIOAMBIENTAL_CRITERIA_CATALOG.filter(
  (c) => !validBlocks.has(c.reportBlockId),
);
ok("reportBlockId válido em todos os critérios", orphanBlocks.length === 0);

for (const listaId of LISTA_CRITERIO_IDS) {
  const entry = SOCIOAMBIENTAL_CRITERIA_CATALOG.find((c) => c.id === listaId);
  ok(`Lista agente — critério ${listaId}`, Boolean(entry));
  if (entry) {
    ok(`  ${listaId} tipoConsulta=lista`, entry.tipoConsulta === "lista" || listaId === "reserva_legal_documento");
  }
}

const modos: ModoRelatorioSocioambiental[] = [
  "extrato_socioambiental",
  "extrato_risco_socioambiental",
  "extrato_completo",
];
for (const modo of modos) {
  const count = SOCIOAMBIENTAL_CRITERIA_CATALOG.filter((c) =>
    c.modosRelatorio.includes(modo),
  ).length;
  ok(`Critérios no modo ${modo}`, count > 0, `count=${count}`);
}

const agregado = countCriteriaForBlocks(
  [...validBlocks] as SocioambientalReportBlockId[],
  "agregado",
  "MG",
);
const porAno = countCriteriaForBlocks(
  [...validBlocks] as SocioambientalReportBlockId[],
  "por_ano",
  "MG",
);
ok("PRODES agregado < por_ano (mais critérios)", agregado < porAno);
ok(`PRODES agregado MG (${agregado})`, agregado > 15);
ok(`PRODES por_ano MG (${porAno})`, porAno > agregado);

console.log("\n=== Camadas (layerId ↔ geo-all-layers) ===\n");

const allLayers = resolveAllLayersForBbox(MG_BBOX);
const layerIdSet = new Set(allLayers.map((l) => l.layerId));
ok(`Camadas resolvidas para bbox MG (${allLayers.length})`, allLayers.length > 30);

const spatialCriteria = SOCIOAMBIENTAL_CRITERIA_CATALOG.filter(
  (c) =>
    c.fonte.layerId &&
    !c.derivado &&
    c.tipoConsulta !== "lista" &&
    c.tipoConsulta !== "car_historico" &&
    c.tipoConsulta !== "metadado",
);
const missingLayers: string[] = [];
for (const c of spatialCriteria) {
  const lid = c.fonte.layerId!;
  if (!layerIdSet.has(lid) && !missingLayers.includes(lid)) {
    missingLayers.push(lid);
  }
}
ok(
  "layerIds espaciais existem em resolveAllLayersForBbox (MG)",
  missingLayers.length === 0,
  missingLayers.length ? `faltam: ${missingLayers.join(", ")}` : undefined,
);

console.log("\n=== Blocos de relatório ===\n");

for (const block of SOCIOAMBIENTAL_REPORT_BLOCKS) {
  const criteria = SOCIOAMBIENTAL_CRITERIA_CATALOG.filter(
    (c) => c.reportBlockId === block.id,
  );
  ok(`Bloco ${block.id} — critérios`, criteria.length > 0);
  const layerIds = resolveLayerIdsForBlocks([block.id], "agregado", "MG");
  ok(`Bloco ${block.id} — layerIds`, layerIds.length > 0);
}

console.log("\n=== Wizard (5 passos) ===\n");

ok("WIZARD_STEP_LABELS = 5 passos", WIZARD_STEP_LABELS.length === 5);
const defaultState = createDefaultWizardState();
ok("createDefaultWizardState — step 0", defaultState.step === 0);
ok("createDefaultWizardState — blocos MG", defaultState.selectedBlocks.length > 0);
ok("MODO_RELATORIO_OPTIONS = 3 modos", MODO_RELATORIO_OPTIONS.length === 3);

for (const preset of ["mg_padrao", "credito_rural", "empreendimento_geral", "protocolo_personalizado"] as const) {
  const blocks = blocksForPreset(preset);
  ok(`Preset ${preset} — blocos`, preset === "protocolo_personalizado" ? blocks.length === 0 : blocks.length > 0);
}

ok(
  "needsRisco — extrato_socioambiental = false",
  !needsRiscoPorGeometria("extrato_socioambiental"),
);
ok(
  "needsRisco — extrato_risco = true",
  needsRiscoPorGeometria("extrato_risco_socioambiental"),
);
ok(
  "needsRisco — extrato_completo = true",
  needsRiscoPorGeometria("extrato_completo"),
);

console.log("\n=== Veredito global ===\n");

ok(
  "Veredito — só Apto → em_conformidade",
  computeVereditoGlobal([{ criterio: "X", resultado: "Apto" }]) === "em_conformidade",
);
ok(
  "Veredito — Inapto → com_restricoes",
  computeVereditoGlobal([{ criterio: "X", resultado: "Inapto" }]) === "com_restricoes",
);
ok(
  "Veredito — Alerta → em_conformidade_com_alertas",
  computeVereditoGlobal([{ criterio: "X", resultado: "Alerta" }]) === "em_conformidade_com_alertas",
);
const resumo = computeResumoCriterios([
  { criterio: "a", resultado: "Apto" },
  { criterio: "b", resultado: "Inapto" },
  { criterio: "c", resultado: "Alerta" },
]);
ok("Resumo — contagem", resumo.apto === 1 && resumo.inapto === 1 && resumo.alerta === 1);

console.log("\n=== Presets bioma / blocos ===\n");

ok("getBlocksForBiomaPreset mg_padrao", getBlocksForBiomaPreset("mg_padrao").length >= 4);
ok("getBlocksForBiomaPreset completo", getBlocksForBiomaPreset("completo").length >= 6);

const activeMg = resolveActiveCriteria({
  blockIds: getBlocksForBiomaPreset("mg_padrao"),
  prodesModo: "agregado",
  uf: "MG",
});
ok(`Critérios ativos preset MG (${activeMg.length})`, activeMg.length > 15);

console.log("\n=== Buffer 3 km (regra de negócio) ===\n");

const bufferCriteria = SOCIOAMBIENTAL_CRITERIA_CATALOG.filter(
  (c) => c.tipoConsulta === "buffer",
);
ok(`Critérios buffer (${bufferCriteria.length})`, bufferCriteria.length >= 4);
for (const c of bufferCriteria) {
  if (c.resultadoSobreposicao === "Inapto") {
    warn(`Buffer ${c.id} com resultadoSobreposicao=Inapto (esperado Alerta)`);
  }
}

console.log(`\n=== Resultado estrutural: ${passed} ok, ${failed} falhou ===`);
if (warnings.length) {
  console.log(`\nAvisos (${warnings.length}):`);
  for (const w of warnings) console.log(`  • ${w}`);
}
console.log("");
process.exit(failed > 0 ? 1 : 0);
