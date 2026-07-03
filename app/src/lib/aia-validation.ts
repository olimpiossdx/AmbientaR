import {
  AIA_PHASES,
  INTERVENTION_SERVICE_LABEL,
  type AiaChecklistContext,
  type AiaImovelSnapshot,
  type InterventionChecklistItem,
} from "@/lib/intervention-checklist";
import type { AiaLinkedArtifacts, Request } from "@/lib/types";

export type AiaValidationAlert = {
  id: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export function buildAiaChecklistContext(request: Pick<
  Request,
  | "interventionSubservices"
  | "imovelSnapshot"
  | "aiaProfile"
  | "tipoIntervencao"
>): AiaChecklistContext {
  return {
    subservices: request.interventionSubservices ?? [],
    imovel: request.imovelSnapshot ?? {},
    orgao: request.aiaProfile?.orgao,
    uf: request.aiaProfile?.uf,
    tipoIntervencao: request.tipoIntervencao,
  };
}

function phase1ItemIds(): string[] {
  return [
    "f1_art",
    "f1_docs_empreendedor",
    "f1_endereco_empreendedor",
    "f1_matriculas",
    "f1_rl_croqui",
    "f1_car",
  ];
}

export function getPhase1RequiredIds(
  imovel: AiaImovelSnapshot,
): string[] {
  const ids = phase1ItemIds();
  if (imovel.multiplosProprietarios) ids.push("f1_carta_anuencia");
  return ids;
}

export function isPhase1Complete(
  checklist: InterventionChecklistItem[],
  imovel: AiaImovelSnapshot,
): boolean {
  const requiredIds = new Set(getPhase1RequiredIds(imovel));
  const items = checklist.filter((i) => requiredIds.has(i.id));
  return items.every(
    (i) =>
      i.status === "completed" ||
      i.status === "not_applicable" ||
      (i.attachments?.length ?? 0) > 0,
  );
}

export function collectAiaAlerts(
  request: Pick<
    Request,
    | "services"
    | "interventionChecklist"
    | "interventionSubservices"
    | "imovelSnapshot"
    | "linkedArtifacts"
  >,
): AiaValidationAlert[] {
  const alerts: AiaValidationAlert[] = [];
  if (!request.services?.includes(INTERVENTION_SERVICE_LABEL)) return alerts;

  const checklist = request.interventionChecklist ?? [];
  const imovel = request.imovelSnapshot ?? {};
  const linked = request.linkedArtifacts ?? {};

  if (!linked.piaId) {
    alerts.push({
      id: "no-pia-link",
      severity: "warning",
      message: "Nenhum PIA vinculado a este processo.",
    });
  }

  const needsInv =
    request.interventionSubservices?.includes("inventario_florestal") ||
    request.interventionSubservices?.includes("censo_florestal");
  if (needsInv && !linked.inventoryId) {
    alerts.push({
      id: "no-inventory-link",
      severity: "warning",
      message: "Inventário florestal marcado, mas sem projeto vinculado.",
    });
  }

  if ((imovel.areaTotalHa ?? 0) > 100) {
    const comp = checklist.find((i) => i.id === "f2_pol_comp");
    if (comp && comp.status === "not_started" && !comp.attachments?.length) {
      alerts.push({
        id: "area-100-comp",
        severity: "info",
        message: "Imóvel > 100 ha: confira POL_COMP e projeto de preservação 2%.",
      });
    }
  }

  if (imovel.multiplosProprietarios) {
    const anuencia = checklist.find((i) => i.id === "f1_carta_anuencia");
    if (
      anuencia &&
      anuencia.status !== "completed" &&
      anuencia.status !== "not_applicable" &&
      !anuencia.attachments?.length
    ) {
      alerts.push({
        id: "anuencia-pending",
        severity: "warning",
        message: "Carta de anuência pendente (múltiplos proprietários).",
      });
    }
  }

  return alerts;
}

export type StatusAdvanceGate = {
  allowed: boolean;
  reason?: string;
};

export function canAdvanceRequestStatus(
  request: Pick<
    Request,
    | "status"
    | "services"
    | "interventionChecklist"
    | "imovelSnapshot"
    | "linkedArtifacts"
    | "interventionSubservices"
  >,
  nextStatus: Request["status"],
): StatusAdvanceGate {
  if (!request.services?.includes(INTERVENTION_SERVICE_LABEL)) {
    return { allowed: true };
  }

  const checklist = request.interventionChecklist ?? [];
  const imovel = request.imovelSnapshot ?? {};
  const attachmentCount = checklist.reduce(
    (acc, c) => acc + (c.attachments?.length ?? 0),
    0,
  );
  const requiredItems = checklist.filter((c) => c.required);
  const requiredCompleted = requiredItems.filter(
    (c) => c.status === "completed" || c.status === "not_applicable",
  ).length;

  if (nextStatus === "Submitted") {
    if (attachmentCount === 0) {
      return {
        allowed: false,
        reason: "Anexe ao menos 1 documento no checklist AIA para enviar.",
      };
    }
    if (!isPhase1Complete(checklist, imovel)) {
      return {
        allowed: false,
        reason:
          "Complete a Fase 1 (documentos base) ou anexe os arquivos obrigatórios antes de enviar.",
      };
    }
  }

  if (nextStatus === "In Progress" && requiredCompleted === 0) {
    return {
      allowed: false,
      reason: "Marque pelo menos 1 item obrigatório do checklist como concluído.",
    };
  }

  if (
    nextStatus === "Completed" &&
    requiredItems.length > 0 &&
    requiredCompleted < requiredItems.length
  ) {
    return {
      allowed: false,
      reason:
        "Conclua todos os itens obrigatórios do checklist AIA antes de finalizar.",
    };
  }

  return { allowed: true };
}

export function getPhaseLabel(phase: string): string {
  return phase;
}

export { AIA_PHASES };
