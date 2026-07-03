import type { GeoLayerResult, WaveAAnalysisResult } from "@/lib/types/geo-wave-a";
import type {
  ResultadoCriterioStatus,
  RiscoCamadaLinha,
  RiscoPorGeometria,
} from "@/lib/types/analise-socioambiental";
import { SOCIOAMBIENTAL_PROXIMIDADE_LIMITE_M } from "@/lib/socioambiental/socioambiental-criteria-catalog";
import { overlapHaFromLayerStats } from "@/lib/socioambiental/regras-criterio";

const BLOCKING_LAYER_RE =
  /embargo|prodes|mapbiomas|quilombola|assentamento|indigen|terra_ind|incra|iphan/i;

function isBlockingLayer(layerId: string, title: string): boolean {
  return BLOCKING_LAYER_RE.test(`${layerId} ${title}`);
}

export function extractLayerRiscoSignals(layer: GeoLayerResult): {
  overlapHa: number;
  bufferHa: number;
  proximityM?: number;
} {
  const overlapHa = overlapHaFromLayerStats(layer.stats);

  const bufferHa =
    layer.stats.find((s) => s.label === "__buffer_overlap__")?.areaHa ?? 0;

  const proxStat = layer.stats.find((s) => s.label === "__proximity_m__");
  const proximityM = proxStat?.count ?? proxStat?.proximityM;

  return { overlapHa, bufferHa, proximityM };
}

export function resultadoLinhaRisco(
  signals: { overlapHa: number; bufferHa: number; proximityM?: number },
  blocking: boolean,
): ResultadoCriterioStatus | null {
  const hasOverlap = signals.overlapHa > 0.01;
  const hasBuffer = signals.bufferHa > 0.01;
  const hasProx =
    signals.proximityM != null &&
    signals.proximityM > 0 &&
    signals.proximityM <= SOCIOAMBIENTAL_PROXIMIDADE_LIMITE_M;

  if (!hasOverlap && !hasBuffer && !hasProx) return null;

  if (hasOverlap && blocking) return "Inapto";
  if (hasOverlap) return "Alerta";
  if (hasBuffer || hasProx) return "Alerta";
  return "Apto";
}

const RESULTADO_ORDER: Record<ResultadoCriterioStatus, number> = {
  Inapto: 0,
  Alerta: 1,
  Apto: 2,
  "Não Analisado": 3,
};

export function buildRiscoPorGeometriaFromWave(params: {
  id: string;
  rotulo: string;
  wave: WaveAAnalysisResult;
}): RiscoPorGeometria {
  const areaHa = params.wave.perimeter.areaHa;
  const linhas: RiscoCamadaLinha[] = [];

  for (const layer of params.wave.layers) {
    if (layer.status === "unavailable") continue;
    const signals = extractLayerRiscoSignals(layer);
    const blocking = isBlockingLayer(layer.layerId, layer.title);
    const resultado = resultadoLinhaRisco(signals, blocking);
    if (!resultado) continue;

    linhas.push({
      tipoRisco: layer.title,
      layerId: layer.layerId,
      sobreposicaoHa: signals.overlapHa,
      sobreposicaoPct:
        areaHa > 0 ? Math.min(100, (signals.overlapHa / areaHa) * 100) : 0,
      proximidadeM:
        signals.proximityM != null && signals.proximityM > 0
          ? Math.round(signals.proximityM)
          : undefined,
      bufferHa: signals.bufferHa > 0.01 ? signals.bufferHa : undefined,
      resultado,
    });
  }

  linhas.sort(
    (a, b) => RESULTADO_ORDER[a.resultado] - RESULTADO_ORDER[b.resultado],
  );

  return {
    id: params.id,
    rotulo: params.rotulo,
    areaHa,
    linhas,
  };
}

export function buildRiscoPorGeometrias(params: {
  imovelWave: WaveAAnalysisResult;
  imovelRotulo?: string;
  glebas: { id: string; rotulo: string; wave: WaveAAnalysisResult }[];
}): RiscoPorGeometria[] {
  const out: RiscoPorGeometria[] = [
    buildRiscoPorGeometriaFromWave({
      id: "imovel",
      rotulo: params.imovelRotulo ?? "Imóvel rural",
      wave: params.imovelWave,
    }),
  ];

  for (const gleba of params.glebas) {
    out.push(
      buildRiscoPorGeometriaFromWave({
        id: gleba.id,
        rotulo: gleba.rotulo,
        wave: gleba.wave,
      }),
    );
  }

  return out;
}

export function needsRiscoPorGeometria(
  modo: import("@/lib/types/analise-socioambiental").ModoRelatorioSocioambiental,
): boolean {
  return (
    modo === "extrato_risco_socioambiental" || modo === "extrato_completo"
  );
}
