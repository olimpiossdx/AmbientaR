import type {
  ConsultoriaEtapa,
  OfficeProcess,
  OfficeProcessFase,
  OfficeProcessPipeline,
  OrgaoEtapa,
} from "@/lib/gestao-processos/types";
import { inferProcessGroup, type ProcessGroup } from "@/lib/gestao-processos/consultoria-project-utils";
import { inferFaseFromStatus, normalizeProcessText } from "@/lib/gestao-processos/utils";

export const CONSULTORIA_ETAPAS: ConsultoriaEtapa[] = [
  "entrada",
  "analise_documental",
  "analise_tecnica_inicial",
  "vistoria_campo",
  "relatorio_estudos",
  "aprovacao_despacho",
  "concluido_protocolo",
];

export const ORGAO_ETAPAS: OrgaoEtapa[] = [
  "entrada_protocolo",
  "analise_documental",
  "analise_tecnica",
  "vistoria_campo",
  "parecer_tecnico",
  "aprovacao_despacho",
  "concluido_arquivado",
];

export const CONSULTORIA_ETAPA_LABELS: Record<ConsultoriaEtapa, string> = {
  entrada: "Entrada / Início",
  analise_documental: "Análise / Juntada Documental",
  analise_tecnica_inicial: "Análise Técnica Inicial",
  vistoria_campo: "Vistoria em Campo",
  relatorio_estudos: "Relatório / Estudos",
  aprovacao_despacho: "Aprovação / Despacho",
  concluido_protocolo: "Concluído / Protocolo",
};

export const ORGAO_ETAPA_LABELS: Record<OrgaoEtapa, string> = {
  entrada_protocolo: "Entrada / Protocolo",
  analise_documental: "Análise Documental",
  analise_tecnica: "Análise Técnica",
  vistoria_campo: "Vistoria de Campo",
  parecer_tecnico: "Parecer Técnico",
  aprovacao_despacho: "Aprovação / Despacho",
  concluido_arquivado: "Concluído / Arquivado",
};

export type ResolvedPipelineState = {
  pipeline: OfficeProcessPipeline;
  etapa: ConsultoriaEtapa | OrgaoEtapa;
  processGroup: ProcessGroup;
};

export function resolveProcessPipelineState(
  process: Pick<
    OfficeProcess,
    | "pipeline"
    | "etapa"
    | "fase"
    | "tipoProcesso"
    | "numeroProcesso"
    | "statusDetalhe"
    | "tipoIntervencao"
    | "processGroup"
  >,
): ResolvedPipelineState {
  const processGroup =
    process.processGroup ?? inferProcessGroup(process.tipoIntervencao);

  if (process.pipeline && process.etapa) {
    if (process.pipeline === "consultoria") {
      const etapa = CONSULTORIA_ETAPAS.includes(process.etapa as ConsultoriaEtapa)
        ? (process.etapa as ConsultoriaEtapa)
        : "entrada";
      return { pipeline: "consultoria", etapa, processGroup };
    }
    if (process.pipeline === "orgao") {
      const etapa = ORGAO_ETAPAS.includes(process.etapa as OrgaoEtapa)
        ? (process.etapa as OrgaoEtapa)
        : "entrada_protocolo";
      return { pipeline: "orgao", etapa, processGroup };
    }
    return {
      pipeline: "encerrado",
      etapa: "concluido_arquivado",
      processGroup,
    };
  }

  if (process.fase === "elaboracao") {
    return { pipeline: "consultoria", etapa: "entrada", processGroup };
  }

  if (process.fase === "concluido" || process.fase === "arquivado") {
    return {
      pipeline: "encerrado",
      etapa: "concluido_arquivado",
      processGroup,
    };
  }

  const hasProtocolNumber = Boolean(normalizeProcessText(process.numeroProcesso));
  if (hasProtocolNumber) {
    const etapa = inferOrgaoEtapaFromFase(process.fase, process.statusDetalhe);
    return { pipeline: "orgao", etapa, processGroup };
  }

  return { pipeline: "consultoria", etapa: "entrada", processGroup };
}

function inferOrgaoEtapaFromFase(
  fase: OfficeProcessFase,
  statusDetalhe?: string,
): OrgaoEtapa {
  if (fase === "protocolado") return "entrada_protocolo";
  if (fase === "exigencia") return "analise_documental";
  if (fase === "em_analise") {
    const s = normalizeProcessText(statusDetalhe).toLowerCase();
    if (/vistor|campo|inspe/.test(s)) return "vistoria_campo";
    if (/parecer/.test(s)) return "parecer_tecnico";
    if (/aprova|despacho|defer/.test(s)) return "aprovacao_despacho";
    return "analise_tecnica";
  }
  return "entrada_protocolo";
}

export function inferConsultoriaEtapaFromFase(fase: OfficeProcessFase): ConsultoriaEtapa {
  if (fase === "elaboracao") return "analise_documental";
  return "entrada";
}

export function syncFaseFromPipeline(
  pipeline: OfficeProcessPipeline,
  etapa: ConsultoriaEtapa | OrgaoEtapa,
): OfficeProcessFase {
  if (pipeline === "encerrado" || etapa === "concluido_arquivado") {
    return etapa === "concluido_arquivado" ? "concluido" : "arquivado";
  }
  if (pipeline === "consultoria") {
    if (etapa === "concluido_protocolo") return "elaboracao";
    return "elaboracao";
  }
  if (etapa === "entrada_protocolo") return "protocolado";
  if (etapa === "analise_documental") return "exigencia";
  if (
    etapa === "analise_tecnica" ||
    etapa === "vistoria_campo" ||
    etapa === "parecer_tecnico"
  ) {
    return "em_analise";
  }
  if (etapa === "aprovacao_despacho") return "em_analise";
  return "protocolado";
}

export function etapaLabel(
  pipeline: OfficeProcessPipeline,
  etapa: ConsultoriaEtapa | OrgaoEtapa,
): string {
  if (pipeline === "consultoria") {
    return CONSULTORIA_ETAPA_LABELS[etapa as ConsultoriaEtapa] ?? etapa;
  }
  return ORGAO_ETAPA_LABELS[etapa as OrgaoEtapa] ?? etapa;
}

export function isPrazoVencido(prazo?: string): boolean {
  if (!prazo) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(prazo.length === 10 ? `${prazo}T12:00:00` : prazo);
  if (Number.isNaN(limit.getTime())) return false;
  limit.setHours(0, 0, 0, 0);
  return limit < today;
}

export function diasAtePrazo(prazo?: string): number | null {
  if (!prazo) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(prazo.length === 10 ? `${prazo}T12:00:00` : prazo);
  if (Number.isNaN(limit.getTime())) return null;
  limit.setHours(0, 0, 0, 0);
  return Math.round((limit.getTime() - today.getTime()) / 86400000);
}

export type FluxoKpiStats = {
  emTramitacao: number;
  prioridadeAlta: number;
  prazosVencidos: number;
  concluidos: number;
};

export function computeFluxoKpiStats(processes: OfficeProcess[]): FluxoKpiStats {
  let emTramitacao = 0;
  let prioridadeAlta = 0;
  let prazosVencidos = 0;
  let concluidos = 0;

  for (const p of processes) {
    const { pipeline, etapa } = resolveProcessPipelineState(p);
    const encerrado =
      pipeline === "encerrado" ||
      etapa === "concluido_arquivado" ||
      p.fase === "concluido" ||
      p.fase === "arquivado";

    if (encerrado) {
      concluidos++;
    } else {
      emTramitacao++;
    }

    if (p.prioridade === "alta") prioridadeAlta++;
    if (!encerrado && isPrazoVencido(p.prazo)) prazosVencidos++;
  }

  return { emTramitacao, prioridadeAlta, prazosVencidos, concluidos };
}

export function defaultPipelineFieldsForNewProcess(): {
  pipeline: OfficeProcessPipeline;
  etapa: ConsultoriaEtapa;
  fase: OfficeProcessFase;
} {
  return {
    pipeline: "consultoria",
    etapa: "entrada",
    fase: "elaboracao",
  };
}

export function inferPipelineFieldsFromImportRow(
  fase: OfficeProcessFase | undefined,
  tipoProcesso: OfficeProcess["tipoProcesso"],
  numeroProcesso: string,
  statusDetalhe?: string,
): Pick<OfficeProcess, "pipeline" | "etapa" | "fase"> {
  const resolvedFase =
    fase ?? inferFaseFromStatus(statusDetalhe, tipoProcesso);
  const stub: Pick<
    OfficeProcess,
    "fase" | "tipoProcesso" | "numeroProcesso" | "statusDetalhe"
  > = {
    fase: resolvedFase,
    tipoProcesso,
    numeroProcesso,
    statusDetalhe,
  };
  const { pipeline, etapa } = resolveProcessPipelineState(stub);
  return {
    pipeline,
    etapa,
    fase: syncFaseFromPipeline(pipeline, etapa),
  };
}

export function buildProtocolTransitionPayload(
  numeroProcesso: string,
  dataProtocolo?: string,
): Pick<
  OfficeProcess,
  "pipeline" | "etapa" | "fase" | "numeroProcesso" | "dataProtocolo"
> {
  return {
    pipeline: "orgao",
    etapa: "entrada_protocolo",
    fase: "protocolado",
    numeroProcesso: normalizeProcessText(numeroProcesso),
    dataProtocolo: dataProtocolo ?? new Date().toISOString().slice(0, 10),
  };
}
