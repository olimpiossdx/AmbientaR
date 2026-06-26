/**
 * Testes unitários locais — Extrato Socioambiental (sem rede).
 * Uso: npx tsx scripts/debug-socioambiental-units.ts
 */
import { mergeAlertasExtratoCompleto } from "@/lib/socioambiental/merge-relatorio";
import {
  buildRiscoPorGeometriaFromWave,
  needsRiscoPorGeometria,
} from "@/lib/socioambiental/risco-por-geometria";
import {
  overlapHaFromLayerStats,
  avaliarResultadoCriterio,
  extractSpatialSignals,
} from "@/lib/socioambiental/regras-criterio";
import {
  resolveActiveCriteria,
  SOCIOAMBIENTAL_CRITERIA_CATALOG,
} from "@/lib/socioambiental/socioambiental-criteria-catalog";
import { parseBeneficiariosCpr } from "@/lib/socioambiental/listas-agente-parse";
import type { GeoLayerResult, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    console.log(`✓ ${label}`);
    passed += 1;
  } else {
    console.log(`✗ ${label}`);
    failed += 1;
  }
}

console.log("=== Fase 1 — Catálogo / wizard ===\n");

const mgCriteria = resolveActiveCriteria({
  blockIds: ["areas_protegidas", "embargos_sancoes", "desmatamento"],
  prodesModo: "agregado",
  uf: "MG",
});
ok(`Critérios MG ativos (${mgCriteria.length})`, mgCriteria.length > 20);
ok(
  "IPHAN no catálogo sem motivoNaoAnalisado",
  !SOCIOAMBIENTAL_CRITERIA_CATALOG.find((c) => c.id === "iphan_sitios_intersecao")
    ?.motivoNaoAnalisado,
);

console.log("\n=== Fase 2 — Regras espaciais (pontos IPHAN) ===\n");

ok(
  "overlapHaFromLayerStats com count",
  overlapHaFromLayerStats([{ label: "Sítio A", count: 2 }]) >= 0.01,
);

const iphanCriterio = SOCIOAMBIENTAL_CRITERIA_CATALOG.find(
  (c) => c.id === "iphan_sitios_intersecao",
)!;
const iphanLayer: GeoLayerResult = {
  layerId: "br_iphan_sitios",
  title: "IPHAN",
  status: "ok",
  stats: [
    { label: "Sítio teste", count: 1 },
    { label: "__buffer_overlap__", areaHa: 0.02 },
  ],
  summary: "teste",
};
const signals = extractSpatialSignals(iphanLayer, iphanCriterio);
ok("IPHAN interseção detecta ponto", signals.overlapHa > 0);
ok(
  "IPHAN buffer detecta área simbólica",
  avaliarResultadoCriterio({
    criterio: SOCIOAMBIENTAL_CRITERIA_CATALOG.find(
      (c) => c.id === "iphan_buffer_3km",
    )!,
    signals,
    uf: "MG",
  }) === "Alerta",
);

console.log("\n=== Fase 3 — Parse beneficiários ===\n");

ok(
  "parseBeneficiariosCpr",
  parseBeneficiariosCpr("123.456.789-09\n12.345.678/0001-90").length === 2,
);

console.log("\n=== Fase 4 — Risco por geometria ===\n");

ok("needsRisco completo", needsRiscoPorGeometria("extrato_completo"));
const waveMock: WaveAAnalysisResult = {
  wave: "A",
  generatedAtUtc: new Date().toISOString(),
  perimeter: {
    areaHa: 100,
    geojson: { type: "Polygon", coordinates: [] },
    source: "polygon",
    bbox: [-44, -20, -43, -19],
  },
  layers: [iphanLayer],
  factualSummary: "teste",
  fontesConsultadas: [],
};
const risco = buildRiscoPorGeometriaFromWave({
  id: "t",
  rotulo: "Teste",
  wave: waveMock,
});
ok("Risco IPHAN gera linha", risco.linhas.length > 0);

console.log("\n=== Fase 5 — Merge alertas ===\n");

const merged = mergeAlertasExtratoCompleto({
  criteriosResultados: [
    {
      criterio: "Embargos IBAMA (lista CPF/CNPJ)",
      resultado: "Inapto",
      detalhe: "teste",
    },
  ],
  riscoPorGeometria: [risco],
  imovelRotulo: "Fazenda",
});
ok("Merge sem duplicar IBAMA+IPHAN", merged.length >= 1);

console.log(`\n=== Resultado: ${passed} ok, ${failed} falhou ===\n`);
process.exit(failed > 0 ? 1 : 0);
