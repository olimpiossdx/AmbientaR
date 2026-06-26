import type {
  OutorgaChecklistDocumento,
  OutorgaProcesso,
  WaterPermit,
} from "@/lib/types";
import { stripUndefinedDeep } from "@/lib/firestore-payload";
import { mergeEstudoTr } from "@/lib/outorga-estudo-tr";
import {
  buildChecklistForModo,
  buildOutorgaLinksExternos,
  getModoUsoByCodigo,
  OUTORGA_ETAPA_LABELS,
  OUTORGA_MG_EXERCICIO_TAXAS,
  OUTORGA_MG_UFEMG,
  type OutorgaChecklistItemDef,
  type OutorgaEtapaProcesso,
} from "@/lib/outorga-mg-catalog";
import type { OutorgaLinksExternos, OutorgaEstudoTr } from "@/lib/types";

export function checklistDefsToDocumentos(
  defs: OutorgaChecklistItemDef[],
): OutorgaChecklistDocumento[] {
  return defs.map((d) => ({
    id: d.id,
    label: d.label,
    obrigatorio: d.obrigatorio,
    cumprido: false,
  }));
}

export function buildInitialOutorgaProcesso(
  modoUsoCodigo: string,
  partial?: Partial<OutorgaProcesso>,
): Omit<OutorgaProcesso, "id"> {
  const modo = getModoUsoByCodigo(modoUsoCodigo);
  const defs = buildChecklistForModo(modoUsoCodigo);
  const now = new Date().toISOString();
  const linksExternos = buildOutorgaLinksExternos(
    modoUsoCodigo,
  ) as OutorgaLinksExternos;

  const doc: Omit<OutorgaProcesso, "id"> = {
    empreendedorId: partial?.empreendedorId ?? "",
    modoUsoCodigo,
    modoUsoLabel: modo?.label ?? modoUsoCodigo,
    tipoServico: modo?.tipoServico ?? "outorga",
    etapaProcesso: "elaboracao_estudos",
    historicoEtapas: [
      {
        etapa: "rascunho",
        em: now,
        nota: "Processo iniciado",
      },
      {
        etapa: "elaboracao_estudos",
        em: now,
        nota: modo?.trPdfUrl
          ? "Elaboração do estudo técnico (TR IGAM vinculado)"
          : "Elaboração do estudo técnico",
      },
    ],
    estudoTr: mergeEstudoTr(modoUsoCodigo, partial?.estudoTr),
    checklistDocumentos: checklistDefsToDocumentos(defs),
    finalidade: partial?.finalidade ?? "",
    processNumber: partial?.processNumber ?? "",
    linksExternos,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };

  if (partial?.projectId) doc.projectId = partial.projectId;
  if (modo?.taxaAnaliseBrl != null) {
    doc.taxaServico = {
      codigo: modoUsoCodigo,
      valorBrl: modo.taxaAnaliseBrl,
      exercicio: OUTORGA_MG_EXERCICIO_TAXAS,
      ufemg: OUTORGA_MG_UFEMG,
    };
  }
  if (partial?.municipio) doc.municipio = partial.municipio;
  if (partial?.coordenadas) doc.coordenadas = partial.coordenadas;
  if (partial?.vazaoRequerida) doc.vazaoRequerida = partial.vazaoRequerida;
  if (partial?.outorgaId) doc.outorgaId = partial.outorgaId;
  if (partial?.createdBy) doc.createdBy = partial.createdBy;

  return stripUndefinedDeep(doc) as Omit<OutorgaProcesso, "id">;
}

export function getEtapaLabel(etapa: OutorgaEtapaProcesso): string {
  return OUTORGA_ETAPA_LABELS[etapa] ?? etapa;
}

/** Cadastro mínimo antes de exibir estudo TR, checklist e demais etapas. */
export function isCadastroInicialCompleto(
  processo: Pick<OutorgaProcesso, "empreendedorId" | "finalidade">,
): boolean {
  return Boolean(
    processo.empreendedorId?.trim() && processo.finalidade?.trim(),
  );
}

/** Sincroniza campos do cadastro inicial no estudo TR. */
export function syncEstudoTrFromCadastro(
  modoUsoCodigo: string,
  processo: Pick<
    OutorgaProcesso,
    "estudoTr" | "finalidade" | "vazaoRequerida" | "municipio" | "coordenadas"
  >,
  projectName?: string,
): OutorgaEstudoTr {
  const base = mergeEstudoTr(modoUsoCodigo, processo.estudoTr);
  const patch: OutorgaEstudoTr = { ...base };
  if (processo.finalidade?.trim()) {
    patch.finalidade_tabela03 = processo.finalidade.trim();
  }
  if (processo.vazaoRequerida?.trim()) {
    patch.vazao_requerida = processo.vazaoRequerida.trim();
  }
  if (processo.municipio?.trim()) {
    patch.municipio_uf = processo.municipio.trim();
  }
  if (processo.coordenadas?.trim()) {
    patch.coordenadas_ponto = processo.coordenadas.trim();
  }
  if (projectName?.trim() && !patch.nome_empreendimento?.trim()) {
    patch.nome_empreendimento = projectName.trim();
  }
  return patch;
}

export function checklistProgress(checklist: OutorgaChecklistDocumento[]): {
  total: number;
  cumpridos: number;
  obrigatoriosPendentes: number;
} {
  const obrigatorios = checklist.filter((c) => c.obrigatorio);
  const cumpridos = checklist.filter((c) => c.cumprido).length;
  const obrigatoriosPendentes = obrigatorios.filter((c) => !c.cumprido).length;
  return {
    total: checklist.length,
    cumpridos,
    obrigatoriosPendentes,
  };
}

/** Dados para criar/atualizar portaria em `outorgas` após deferimento. */
export function buildWaterPermitFromProcesso(
  processo: OutorgaProcesso,
  portaria: {
    permitNumber: string;
    issueDate: string;
    expirationDate: string;
    fileUrl?: string;
  },
): Omit<WaterPermit, "id"> {
  return {
    empreendedorId: processo.empreendedorId,
    projectId: processo.projectId,
    permitNumber: portaria.permitNumber,
    processNumber: processo.processNumber || "",
    issueDate: portaria.issueDate,
    expirationDate: portaria.expirationDate,
    status: "Válida",
    description: processo.finalidade || processo.modoUsoLabel,
    interventionType: processo.modoUsoLabel,
    modoUsoCodigo: processo.modoUsoCodigo,
    outorgaProcessoId: processo.id,
    fileUrl: portaria.fileUrl,
    monitoringType: "manual",
    pontosDeMonitoramento: [],
    monthlyLimitM3: processo.monthlyLimitM3,
    dailyLimitM3: processo.dailyLimitM3,
    dailyHoursLimit: processo.dailyHoursLimit,
    maxDaysPerMonth: processo.maxDaysPerMonth,
    condicionanteFlowLimitM3s: processo.condicionanteFlowLimitM3s,
    miraStationId: processo.miraStationId,
  };
}
