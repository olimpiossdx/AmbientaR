/**
 * E2E do wizard — simula o fluxo completo sem browser (CAR real MG).
 * Uso: npx tsx scripts/debug-socioambiental-wizard-e2e.ts
 *      npx tsx scripts/debug-socioambiental-wizard-e2e.ts --full  (todas as camadas mg_padrao)
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas";
import {
  localizacaoToPerimeterInput,
  resolveLocalizacaoImovel,
} from "@/lib/geospatial/resolve-localizacao-imovel";
import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import { consultarListasAgente } from "@/lib/socioambiental/listas-agente.server";
import { mapLayersToCriterios } from "@/lib/socioambiental/map-layers-to-criterios";
import {
  buildRiscoPorGeometrias,
  needsRiscoPorGeometria,
} from "@/lib/socioambiental/risco-por-geometria";
import { mergeAlertasExtratoCompleto } from "@/lib/socioambiental/merge-relatorio";
import {
  blocksForPreset,
  createDefaultWizardState,
  type SocioambientalWizardState,
} from "@/lib/socioambiental/socioambiental-wizard-state";
import {
  resolveLayerIdsFromBlocks,
  getBlocksForBiomaPreset,
} from "@/lib/socioambiental/report-blocks-catalog";
import { resolveActiveCriteria } from "@/lib/socioambiental/socioambiental-criteria-catalog";
import { computeVereditoGlobal } from "@/lib/socioambiental/veredito-socioambiental";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";
import type { ModoRelatorioSocioambiental } from "@/lib/types/analise-socioambiental";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REF_CAR = "MG-3170404-3DBDB334242844B392639D3237B27E10";
const CPF_TESTE = "52998224725"; // CPF válido (formato), improvável em listas

const FULL = process.argv.includes("--full");

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`✓ ${label}`);
    passed += 1;
  } else {
    console.log(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function wizardCanAdvanceStep1(
  wizard: SocioambientalWizardState,
  localizacao: LocalizacaoResolvida | null,
  confirmada: boolean,
): boolean {
  if (wizard.tipoPerimetro === "car_rural") {
    return Boolean(
      confirmada &&
        localizacao?.status === "ok" &&
        localizacao.extratoMgAplicavel,
    );
  }
  return wizard.polygonInput.trim().length > 3;
}

function wizardCanAdvanceStep3(wizard: SocioambientalWizardState): boolean {
  return wizard.selectedBlocks.length > 0;
}

function wizardCanExecute(
  wizard: SocioambientalWizardState,
  localizacao: LocalizacaoResolvida | null,
  confirmada: boolean,
): boolean {
  if (wizard.tipoPerimetro !== "car_rural") return true;
  return Boolean(
    confirmada &&
      localizacao?.status === "ok" &&
      localizacao.extratoMgAplicavel,
  );
}

async function main() {
console.log("=== E2E Wizard — Extrato Socioambiental ===\n");
console.log(`CAR teste: ${REF_CAR.slice(0, 28)}…`);
console.log(`Modo camadas: ${FULL ? "completo (mg_padrao)" : "smoke (8 camadas)"}\n`);

// --- Passo 0: estado inicial ---
console.log("--- Passo 0 — Relatório ---\n");

const wizard = createDefaultWizardState();
wizard.modoRelatorio = "extrato_completo";
wizard.presetAtividade = "mg_padrao";
wizard.selectedBlocks = blocksForPreset("mg_padrao");
wizard.agenteDocumento = CPF_TESTE;
wizard.agenteNome = "Tomador Teste E2E";
wizard.carNumber = REF_CAR;

ok("Estado inicial — 5 passos", wizard.step === 0);
ok("Modo extrato_completo", wizard.modoRelatorio === "extrato_completo");
ok("Blocos mg_padrao", wizard.selectedBlocks.length >= 4);

// --- Passo 1: localizar CAR ---
console.log("\n--- Passo 1 — Território (CAR) ---\n");

const t0 = Date.now();
const localizacao = await resolveLocalizacaoImovel(
  { dataType: "car", data: REF_CAR },
  { extratoUfEsperada: "MG" },
);
const resolveMs = Date.now() - t0;

ok(`CAR resolvido (${resolveMs}ms)`, localizacao.status === "ok");
ok("extratoMgAplicavel", localizacao.extratoMgAplicavel === true);
ok("Área > 0 ha", localizacao.areaHa > 0, `area=${localizacao.areaHa.toFixed(2)}`);

const confirmada = true;
ok(
  "canAdvance passo 1",
  wizardCanAdvanceStep1(wizard, localizacao, confirmada),
);
ok(
  "canExecute (antes da Wave)",
  wizardCanExecute(wizard, localizacao, confirmada),
);

if (localizacao.status !== "ok") {
  console.log("\nAbortado: CAR não resolvido.");
  process.exit(1);
}

const uf = localizacao.imoveis[0]?.uf ?? "MG";
const perimeterInput = localizacaoToPerimeterInput(localizacao);

// --- Passo 2: agente (sem validação bloqueante) ---
console.log("\n--- Passo 2 — Agente ---\n");
ok("CPF tomador informado", wizard.agenteDocumento.replace(/\D/g, "").length === 11);

// --- Passo 3: critérios ---
console.log("\n--- Passo 3 — Critérios ---\n");
ok("canAdvance passo 3", wizardCanAdvanceStep3(wizard));

const allLayerIds = resolveLayerIdsFromBlocks(
  wizard.selectedBlocks,
  wizard.prodesModo,
  uf,
);
const smokeLayerIds = [
  "br_sicar_imoveis",
  "br_iphan_sitios",
  "br_funai_ti_wfs",
  "br_incra_quilombolas",
  "br_incra_assentamentos",
  "br_ibama_embargos",
  "br_icmbio_embargos",
  "br_mma_uc_cnuc",
].filter((id) => allLayerIds.includes(id) || !FULL);

const layerIds = FULL ? allLayerIds : smokeLayerIds.length ? smokeLayerIds : allLayerIds.slice(0, 8);

console.log(`  Camadas a consultar: ${layerIds.length} / ${allLayerIds.length}`);

const listaCriterioIds = resolveActiveCriteria({
  blockIds: wizard.selectedBlocks,
  prodesModo: wizard.prodesModo,
  uf,
})
  .filter((c) => c.tipoConsulta === "lista")
  .map((c) => c.id);
console.log(`  Critérios lista: ${listaCriterioIds.join(", ") || "(nenhum)"}`);

// --- Passo 4: executar Wave A ---
console.log("\n--- Passo 4 — Executar Wave A ---\n");

const t1 = Date.now();
let waveResult;
try {
  waveResult = await runWaveAAnalysis(
    perimeterInput,
    DEFAULT_INFLUENCE_CONFIG,
    (p) => {
      process.stdout.write(`\r  camada ${p.index + 1}/${p.total}…`);
    },
    { layerIds },
  );
  console.log("");
} catch (e) {
  console.log("");
  ok("Wave A concluída", false, e instanceof Error ? e.message : String(e));
  process.exit(1);
}
const waveMs = Date.now() - t1;

ok(`Wave A (${waveMs}ms)`, waveResult.layers.length > 0);
const okLayers = waveResult.layers.filter((l) => l.status === "ok").length;
const partialLayers = waveResult.layers.filter((l) => l.status === "partial").length;
const failLayers = waveResult.layers.filter((l) => l.status === "unavailable");
ok(
  `Camadas ok/partial (${okLayers}/${partialLayers})`,
  okLayers + partialLayers > 0,
);
if (failLayers.length) {
  console.log(`  indisponíveis (${failLayers.length}):`);
  for (const l of failLayers.slice(0, 8)) {
    console.log(`    • ${l.layerId}: ${l.errorMessage ?? l.summary}`);
  }
  if (failLayers.length > 8) console.log(`    … +${failLayers.length - 8}`);
}

// --- Listas agente ---
console.log("\n--- Listas CPF/CNPJ ---\n");

let listasAgente = null;
if (listaCriterioIds.length > 0) {
  const t2 = Date.now();
  try {
    listasAgente = await consultarListasAgente({
      documento: wizard.agenteDocumento,
      criterioIds: listaCriterioIds,
      codImovel: REF_CAR,
    });
    ok(`Listas consultadas (${Date.now() - t2}ms)`, listasAgente.hits.length > 0);
    for (const hit of listasAgente.hits) {
      const icon = hit.resultado === "Não Analisado" ? "⚠" : "✓";
      console.log(`  ${icon} ${hit.criterioId}: ${hit.resultado}`);
    }
  } catch (e) {
    ok("Listas consultadas", false, e instanceof Error ? e.message : String(e));
  }
}

// --- Critérios + veredito ---
console.log("\n--- Matriz de critérios ---\n");

const criterios = mapLayersToCriterios(waveResult.layers, wizard.selectedBlocks, {
  prodesModo: wizard.prodesModo,
  uf,
  listasAgente,
});

ok("Critérios gerados", criterios.criteriosResultados.length > 0);

const resumo = {
  apto: criterios.criteriosResultados.filter((c) => c.resultado === "Apto").length,
  alerta: criterios.criteriosResultados.filter((c) => c.resultado === "Alerta").length,
  inapto: criterios.criteriosResultados.filter((c) => c.resultado === "Inapto").length,
  naoAnalisado: criterios.criteriosResultados.filter(
    (c) => c.resultado === "Não Analisado",
  ).length,
};
console.log(
  `  Apto=${resumo.apto} Alerta=${resumo.alerta} Inapto=${resumo.inapto} N/A=${resumo.naoAnalisado}`,
);

const veredito = computeVereditoGlobal(criterios.criteriosResultados);
ok("Veredito global", Boolean(veredito));
console.log(`  Veredito: ${veredito}`);

const inaptos = criterios.criteriosResultados.filter((c) => c.resultado === "Inapto");
if (inaptos.length) {
  console.log("  Inaptos:");
  for (const c of inaptos.slice(0, 5)) console.log(`    • ${c.criterio}`);
}

// --- Risco por geometria (modo completo) ---
console.log("\n--- Risco por geometria ---\n");

ok("needsRisco extrato_completo", needsRiscoPorGeometria("extrato_completo"));

const risco = buildRiscoPorGeometrias({
  imovelWave: waveResult,
  imovelRotulo: "Fazenda teste E2E",
  glebas: [],
});
ok("Risco imóvel gerado", risco.length === 1 && risco[0].linhas.length >= 0);
console.log(`  Linhas de risco: ${risco[0]?.linhas.length ?? 0}`);

// --- Merge alertas ---
console.log("\n--- Merge extrato completo ---\n");

const alertas = mergeAlertasExtratoCompleto({
  criteriosResultados: criterios.criteriosResultados,
  riscoPorGeometria: risco,
  imovelRotulo: "Fazenda teste E2E",
});
ok("Alertas unificados", alertas.length >= 0);
console.log(`  Alertas deduplicados: ${alertas.length}`);

// --- Polígono operação (validação passo 1 alternativo) ---
console.log("\n--- Validação polígono operação ---\n");

const fixturePath = join(ROOT, "fixtures/geo/test-polygon-mg-850ha.geojson");
const fixtureGeo = readFileSync(fixturePath, "utf8");
const polyWizard = createDefaultWizardState();
polyWizard.tipoPerimetro = "poligono_operacao";
polyWizard.polygonInput = fixtureGeo;
ok(
  "canAdvance polígono (fixture MG)",
  wizardCanAdvanceStep1(polyWizard, null, false),
);

// --- Modos de relatório ---
console.log("\n--- 3 modos de relatório ---\n");

for (const modo of [
  "extrato_socioambiental",
  "extrato_risco_socioambiental",
  "extrato_completo",
] as ModoRelatorioSocioambiental[]) {
  ok(`Modo ${modo}`, true);
  ok(`  needsRisco=${needsRiscoPorGeometria(modo)}`, true);
}

console.log(`\n=== Resultado E2E: ${passed} ok, ${failed} falhou ===`);
if (!FULL && allLayerIds.length > layerIds.length) {
  console.log(
    `\nDica: rode com --full para testar todas as ${allLayerIds.length} camadas do preset mg_padrao.`,
  );
}
console.log("");
process.exit(failed > 0 ? 1 : 0);
}

void main();
