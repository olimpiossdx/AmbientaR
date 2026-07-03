import type { CarSnapshotRecord } from "@/lib/geospatial/car-snapshot-store";

export type CarHistoricoAlerta = {
  tipo: "geometria_alterada" | "area_reduzida" | "risco_ausente" | "primeira_versao";
  severidade: "info" | "alerta";
  mensagem: string;
};

export type CarHistoricoAvaliacao = {
  codImovel: string;
  totalSnapshots: number;
  alertas: CarHistoricoAlerta[];
  /** Resultado do critério socioambiental */
  resultado: "Apto" | "Alerta" | "Não Analisado";
  detalhe: string;
  anterior?: CarSnapshotRecord;
  atual?: CarSnapshotRecord;
};

const AREA_REDUCAO_ALERTA_HA = 1;
const AREA_REDUCAO_ALERTA_PCT = 0.5;

export function compareCarSnapshotHistory(
  records: CarSnapshotRecord[],
  codImovel: string,
): CarHistoricoAvaliacao {
  const sorted = [...records].sort(
    (a, b) =>
      new Date(b.capturedAtUtc).getTime() - new Date(a.capturedAtUtc).getTime(),
  );

  if (sorted.length === 0) {
    return {
      codImovel,
      totalSnapshots: 0,
      alertas: [],
      resultado: "Não Analisado",
      detalhe: "Nenhum snapshot CAR registrado pelo AmbientaR.",
    };
  }

  if (sorted.length === 1) {
    return {
      codImovel,
      totalSnapshots: 1,
      alertas: [
        {
          tipo: "primeira_versao",
          severidade: "info",
          mensagem:
            "Primeira versão registrada. Execute novamente no futuro para comparar retificações.",
        },
      ],
      resultado: "Apto",
      detalhe: "Histórico CAR: 1 versão — sem comparação anterior.",
      atual: sorted[0],
    };
  }

  const atual = sorted[0]!;
  const anterior = sorted[1]!;
  const alertas: CarHistoricoAlerta[] = [];

  if (atual.geometryFingerprint !== anterior.geometryFingerprint) {
    alertas.push({
      tipo: "geometria_alterada",
      severidade: "alerta",
      mensagem: `Perímetro SICAR alterado desde ${formatDate(anterior.capturedAtUtc)}.`,
    });
  }

  const deltaHa = anterior.areaHa - atual.areaHa;
  const deltaPct =
    anterior.areaHa > 0 ? (deltaHa / anterior.areaHa) * 100 : 0;
  if (
    deltaHa > AREA_REDUCAO_ALERTA_HA ||
    deltaPct > AREA_REDUCAO_ALERTA_PCT
  ) {
    alertas.push({
      tipo: "area_reduzida",
      severidade: "alerta",
      mensagem: `Área reduzida ${deltaHa.toFixed(2)} ha (${deltaPct.toFixed(1)}%) — verificar retificação CAR.`,
    });
  }

  const prevRisco = anterior.riscoCamadas?.length ?? 0;
  const currRisco = atual.riscoCamadas?.length ?? 0;
  if (prevRisco > 0 && currRisco < prevRisco) {
    alertas.push({
      tipo: "risco_ausente",
      severidade: "alerta",
      mensagem:
        "Execução anterior detectou sobreposições que não aparecem na geometria/dados actuais — possível omissão na retificação.",
    });
  }

  const hasAlerta = alertas.some((a) => a.severidade === "alerta");
  const detalhe = hasAlerta
    ? alertas.map((a) => a.mensagem).join(" ")
    : "Nenhuma alteração relevante entre as duas últimas versões registradas.";

  return {
    codImovel,
    totalSnapshots: sorted.length,
    alertas,
    resultado: hasAlerta ? "Alerta" : "Apto",
    detalhe,
    anterior,
    atual,
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso.slice(0, 10);
  }
}

/** Camadas Wave A com sobreposição relevante (> 0,01 ha). */
export function extractRiscoCamadasFromWave(
  layers: { layerId: string; stats: { areaHa?: number; label?: string }[] }[],
): string[] {
  return layers
    .filter((l) =>
      l.stats.some(
        (s) =>
          s.label !== "__buffer_overlap__" &&
          s.label !== "__proximity_m__" &&
          (s.areaHa ?? 0) > 0.01,
      ),
    )
    .map((l) => l.layerId);
}
