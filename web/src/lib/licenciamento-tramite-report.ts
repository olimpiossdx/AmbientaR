/**
 * Texto estruturado de trâmite (licenciamento) para PDF e e-mail.
 */

import {
  INTERVENTION_SERVICE_LABEL,
  getChecklistStatusLabel,
  type InterventionChecklistItem,
} from "@/lib/intervention-checklist";
import { LICENCIAMENTO_MENU_LABEL } from "@/lib/licenciamento-menu";
import { sortStringsPt } from "@/lib/sort-pt-br";
import type { Request } from "@/lib/types";

export type LicenciamentoTramiteReportContext = {
  request: Request;
  solicitationNumber: string;
  statusLabel: string;
  empreendedorName?: string;
  projectName?: string;
};

const STATUS_FLOW: Request["status"][] = [
  "Draft",
  "Submitted",
  "In Progress",
  "Completed",
];

export function getLicenciamentoStatusLabel(
  status: Request["status"],
): string {
  const map: Record<Request["status"], string> = {
    Draft: "Rascunho",
    Submitted: "Enviado",
    "In Progress": "Em andamento",
    Completed: "Concluído",
  };
  return map[status] ?? status;
}

export function formatLicenciamentoSolicitationNumber(
  request: Request,
): string {
  const year = request.createdAt
    ? (
        request.createdAt.toDate
          ? request.createdAt.toDate()
          : new Date(request.createdAt)
      ).getFullYear()
    : "S/A";
  return (
    request.solicitationNumber ||
    `${request.id.substring(0, 8).toUpperCase()}/${year}`
  );
}

function formatCriterioLocacionalLabel(c: "0" | "1" | "2"): string {
  switch (c) {
    case "0":
      return "0 - Sem critério";
    case "1":
      return "1 - Médio";
    case "2":
      return "2 - Alto";
    default:
      return String(c);
  }
}

function locationalInputModeLabel(mode: string): string {
  const map: Record<string, string> = {
    car: "CAR",
    polygon: "GeoJSON",
    coordinates: "Coordenadas",
    draw: "Desenho no mapa",
  };
  return map[mode] ?? mode;
}

function formatDateValue(timestamp: unknown): string {
  if (!timestamp) return "—";
  const date =
    timestamp &&
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof (timestamp as { toDate: () => Date }).toDate === "function"
      ? (timestamp as { toDate: () => Date }).toDate()
      : new Date(timestamp as string | number | Date);
  return date.toLocaleDateString("pt-BR");
}

function checklistProgress(request: Request): string | null {
  if (!request.interventionChecklist?.length) return null;
  const required = request.interventionChecklist.filter((c) => c.required);
  const done = required.filter((c) => c.status === "completed").length;
  const total = required.length || request.interventionChecklist.length;
  return `${done}/${total}`;
}

function requiredPendingCount(request: Request): number {
  if (!request.interventionChecklist?.length) return 0;
  return request.interventionChecklist.filter(
    (c) => c.required && c.status !== "completed",
  ).length;
}

/** Linhas de texto (corpo de e-mail ou secções do PDF). */
export function buildLicenciamentoTramiteReportLines(
  ctx: LicenciamentoTramiteReportContext,
): string[] {
  const { request } = ctx;
  const lines: string[] = [
    `${LICENCIAMENTO_MENU_LABEL} — Resumo do trâmite`,
    "",
    `Nº do trâmite: ${ctx.solicitationNumber}`,
    `Status: ${ctx.statusLabel}`,
    `Empreendedor: ${ctx.empreendedorName?.trim() || "—"}`,
    `Empreendimento: ${ctx.projectName?.trim() || "—"}`,
    `Data de criação: ${formatDateValue(request.createdAt)}`,
    "",
    "Serviços requeridos:",
    ...(sortStringsPt(request.services ?? []).length
      ? sortStringsPt(request.services ?? []).map((s) => `  • ${s}`)
      : ["  —"]),
    "",
    "Linha do tempo:",
    ...STATUS_FLOW.map((s) => {
      const currentIdx = STATUS_FLOW.indexOf(request.status);
      const idx = STATUS_FLOW.indexOf(s);
      const mark = idx <= currentIdx ? "[x]" : "[ ]";
      return `  ${mark} ${getLicenciamentoStatusLabel(s)}`;
    }),
  ];

  if (
    request.services.includes("Licenciamento ambiental") &&
    request.licensingData
  ) {
    const ld = request.licensingData;
    lines.push("", "Licenciamento ambiental:");
    lines.push(
      `  Classe sugerida: ${ld.grading.classeSugerida}`,
      `  Modalidade sugerida: ${ld.grading.modalidadeSugerida}`,
      `  Porte / Potencial: ${ld.grading.porte} / ${ld.grading.potencial}`,
      `  Critério locacional: ${formatCriterioLocacionalLabel(ld.grading.criterioLocacional)}`,
      `  Documentos marcados: ${ld.documents.filter((d) => d.checked).length}`,
    );
    if (ld.activities?.length) {
      lines.push("  Atividades:");
      for (const a of ld.activities) {
        lines.push(
          `    - ${a.codeGroup}/${a.subItem}${a.description ? `: ${a.description}` : ""}`,
        );
      }
    }
    if (ld.locationalAnalysis) {
      lines.push(
        "  Análise locacional:",
        `    Entrada: ${locationalInputModeLabel(ld.locationalAnalysis.inputMode)}`,
        `    Sugestão: ${formatCriterioLocacionalLabel(ld.locationalAnalysis.suggestedCriterio)}`,
        `    Data: ${formatDateValue(ld.locationalAnalysis.analyzedAt)}`,
      );
      if (ld.locationalAnalysis.reasons?.length) {
        for (const r of ld.locationalAnalysis.reasons) {
          lines.push(`    • ${r}`);
        }
      }
    }
  }

  if (request.services.includes(INTERVENTION_SERVICE_LABEL)) {
    lines.push("", "Autorização para Intervenção Ambiental (AIA):");
    const progress = checklistProgress(request);
    if (progress) lines.push(`  Checklist (obrigatórios concluídos): ${progress}`);
    lines.push(`  Pendências obrigatórias: ${requiredPendingCount(request)}`);
    if (request.interventionChecklist?.length) {
      const counters: Record<InterventionChecklistItem["status"], number> = {
        not_started: 0,
        collecting: 0,
        not_applicable: 0,
        completed: 0,
      };
      for (const c of request.interventionChecklist) counters[c.status] += 1;
      lines.push("  Resumo do checklist:");
      for (const key of Object.keys(counters) as InterventionChecklistItem["status"][]) {
        if (counters[key] > 0) {
          lines.push(`    - ${getChecklistStatusLabel(key)}: ${counters[key]}`);
        }
      }
    }
  }

  lines.push(
    "",
    "—",
    "Documento gerado pelo AmbientaR (EcoGestão MG).",
  );
  return lines;
}

export function buildLicenciamentoTramiteMailto(
  ctx: LicenciamentoTramiteReportContext,
): { subject: string; body: string; mailtoUrl: string } {
  const subject = `[${LICENCIAMENTO_MENU_LABEL}] Trâmite ${ctx.solicitationNumber}`;
  const body = buildLicenciamentoTramiteReportLines(ctx).join("\n");
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, body, mailtoUrl };
}

export function licenciamentoTramitePdfFilename(
  ctx: LicenciamentoTramiteReportContext,
): string {
  const safe = ctx.solicitationNumber.replace(/[^\w\-./]+/g, "_");
  return `Tramite_${LICENCIAMENTO_MENU_LABEL}_${safe}.pdf`;
}
