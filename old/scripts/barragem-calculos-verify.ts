/**
 * Verificação dos cálculos de barragem (exemplos do manual §18–19).
 * Uso: npx tsx scripts/barragem-calculos-verify.ts
 */
import {
  rationalMethod,
  kirpichTc,
  spillwayWidth,
  cotaAreaVolumeRow,
  calcularTabelaCotaAreaVolume,
  ripplAnalise,
  bishopSimplified,
  morgensternPriceHalfSine,
  morgensternPriceHalfSineFactors,
} from '../src/lib/barragem/calculos';
import {
  buildTriangularHydrograph,
  validateHecRasExport,
} from '../src/lib/seguranca-barragens/hec-ras-export';
import { parseHecRasResultadosFile } from '../src/lib/seguranca-barragens/hec-ras-import';
import {
  gravityDamHorizontalForce,
  gravityDamStability,
  gravityDamBaseStresses,
} from '../src/lib/barragem/calculos/gravity-dam-stability';
import type { EstudoSegurancaBarragem } from '../src/lib/types';

function assertNear(actual: number, expected: number, tol: number, label: string) {
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: esperado ~${expected}, obteve ${actual}`);
  }
}

// Manual §18: Q = 66,72 m³/s
const racional = rationalMethod(0.4, 120, 5);
assertNear(racional.result.Q_m3s, 66.72, 0.05, 'rationalMethod');

// Manual §19: L ≈ 28,21 m
const vertedouro = spillwayWidth(66.72, 1.8, 1.2);
assertNear(vertedouro.result.L_m, 28.21, 0.1, 'spillwayWidth');

// Kirpich smoke
const tc = kirpichTc(2.5, 150);
if (tc.result.Tc_min <= 0) throw new Error('kirpichTc deve ser positivo');

// Volume parcial
const vol = cotaAreaVolumeRow(1000, 1500, 1);
assertNear(vol.result.V_parcial_m3, 1250, 0.01, 'cotaAreaVolumeRow');

// Tabela
const tabela = calcularTabelaCotaAreaVolume([
  { cota: 100, areaM2: 500 },
  { cota: 101, areaM2: 800 },
  { cota: 102, areaM2: 1200 },
]);
if (tabela.length !== 3) throw new Error('tabela deve ter 3 linhas');
if (tabela[2].volumeAcumuladoM3 <= tabela[1].volumeAcumuladoM3) {
  throw new Error('volume acumulado deve crescer');
}

// Rippl — maior déficit acumulado = 40 m³
const rippl = ripplAnalise([
  { vAfluente_m3: 100, vDemanda_m3: 50 },
  { vAfluente_m3: 30, vDemanda_m3: 50 },
  { vAfluente_m3: 30, vDemanda_m3: 50 },
  { vAfluente_m3: 100, vDemanda_m3: 50 },
]);
assertNear(rippl.result.volumeUtilNecessario_m3, 40, 0.01, 'ripplAnalise');

// Bishop — 1 fatia, resultado estável > 1
const bishop = bishopSimplified(
  [{ label: 'F1', larguraM: 2, pesoKN: 100, anguloBaseGrau: 20, ubKN: 0 }],
  5,
  25,
  'operacao_normal',
);
if (bishop.result.FS < 1 || bishop.result.FS > 5) {
  throw new Error(`bishopSimplified: FS fora do intervalo esperado: ${bishop.result.FS}`);
}

// Morgenstern-Price — mesma fatia de teste
const mp = morgensternPriceHalfSine(
  [{ label: 'F1', larguraM: 2, pesoKN: 100, anguloBaseGrau: 20, ubKN: 0 }],
  5,
  25,
  'operacao_normal',
);
if (mp.result.FS <= 0 || mp.result.FS > 5) {
  throw new Error(`morgensternPriceHalfSine: FS fora do intervalo: ${mp.result.FS}`);
}
if (morgensternPriceHalfSineFactors(3).length !== 3) {
  throw new Error('morgensternPriceHalfSineFactors deve retornar n fatores');
}

// Hidrograma triangular Qp = 2V/T — V=36000 m³, T=2 h → Qp = 10 m³/s
const hidro = buildTriangularHydrograph(36000, 2);
assertNear(hidro.qpM3s, 10, 0.01, 'buildTriangularHydrograph Qp');
if (hidro.pontos.length < 2) throw new Error('hidrograma deve ter pontos');
assertNear(hidro.pontos[0].vazao_m3s, 0, 0.001, 'hidro início');
const mid = hidro.pontos[Math.floor(hidro.pontos.length / 2)];
assertNear(mid.vazao_m3s, hidro.qpM3s, 0.05, 'hidro pico');

const estudoMinimo = {
  id: 'test',
  damBreak: { volumeMobilizadoM3: '1000', tempoFormacaoH: '1' },
} as EstudoSegurancaBarragem;
if (validateHecRasExport(estudoMinimo).length > 0) {
  throw new Error('validateHecRasExport deve aceitar V e T válidos');
}
const estudoIncompleto = { id: 'test', damBreak: {} } as EstudoSegurancaBarragem;
if (validateHecRasExport(estudoIncompleto).length === 0) {
  throw new Error('validateHecRasExport deve rejeitar Dam Break vazio');
}

// Concreto gravidade — h=10 m → Fh = 9.81*100/2 = 490.5 kN/m
const empuxo = gravityDamHorizontalForce(10);
assertNear(empuxo.Fh_kN, 490.5, 0.1, 'gravityDamHorizontalForce');
assertNear(empuxo.bracoEmpuxoM, 10 / 3, 0.01, 'bracoEmpuxo');

const gravidade = gravityDamStability({
  alturaAguaM: 10,
  pesoKN: 5000,
  subpressaoKN: 200,
  areaBaseM2: 12,
  coesaoKpa: 100,
  anguloAtritoGrau: 35,
  bracoPesoM: 8,
});
if (gravidade.result.fsDeslizamento <= 0 || gravidade.result.fsTombamento <= 0) {
  throw new Error('gravityDamStability deve retornar FS positivos');
}
if (gravidade.result.tensaoMaxKpa <= gravidade.result.tensaoMinKpa) {
  throw new Error('tensaoMax deve ser maior que tensaoMin quando há flexão');
}

// σ = W′/B ± M/S — B=10, W′=5000, M=3366.67 → flex ≈ 202 kPa
const tensoes = gravityDamBaseStresses(5000, 10, 3366.67);
assertNear(tensoes.tensaoMediaKpa, 500, 0.1, 'tensaoMedia');
assertNear(tensoes.tensaoMaxKpa, 702, 1, 'tensaoMax');
assertNear(tensoes.tensaoMinKpa, 298, 1, 'tensaoMin');

// HEC-RAS import — pacote AmbientaR
const pkgJson = JSON.stringify({
  format: 'AmbientaR-HEC-RAS-resultados',
  version: '1.0',
  resumo: { profundidadeMaxM: 3.5, velocidadeMaxMs: 2.1, tempoChegadaMinMin: 45 },
  pontosInteresse: [{ label: 'P1', profundidadeMaxM: 3.5, tempoChegadaMin: 45 }],
});
const hecImport = parseHecRasResultadosFile(pkgJson, 'resultados.json');
if (!hecImport.data.resumo?.profundidadeMaxM) {
  throw new Error('parseHecRasResultadosFile deve extrair profundidade');
}

// CSV pontos
const csv = 'label,lat,lng,profundidade_m,velocidade_ms,tempo_chegada_min\nA,-19.9,-43.9,2.5,1.2,30';
const csvImport = parseHecRasResultadosFile(csv, 'pontos.csv');
if (csvImport.data.pontos?.length !== 1) {
  throw new Error('parseHecRas CSV deve importar 1 ponto');
}

console.log('[barragem-calculos-verify] OK — exemplos do manual validados.');
