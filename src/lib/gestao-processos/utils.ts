import type { OfficeProcessFase, OfficeProcessTipo } from "@/lib/gestao-processos/types";

const SEI_NUMBER_RE =
  /^\d{4}\.\d{2}\.\d+\/\d{4}-\d{2}$/;

export const OFFICE_PROCESS_FASE_LABELS: Record<OfficeProcessFase, string> = {
  elaboracao: "Em elaboração",
  protocolado: "Protocolado",
  em_analise: "Em análise",
  exigencia: "Exigência",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

export function normalizeProcessText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export function detectTipoProcesso(numero: string): OfficeProcessTipo {
  const n = normalizeProcessText(numero);
  if (SEI_NUMBER_RE.test(n)) return "sei";
  return "sla";
}

export function buildOfficeProcessExternalKey(
  tipo: OfficeProcessTipo,
  numero: string,
): string {
  return `${tipo}:${normalizeProcessText(numero).toLowerCase()}`;
}

export function inferFaseFromStatus(
  statusDetalhe: string | undefined,
  tipoProcesso: OfficeProcessTipo,
): OfficeProcessFase {
  const s = normalizeProcessText(statusDetalhe).toLowerCase();
  if (!s) {
    return tipoProcesso === "sei" || tipoProcesso === "sla"
      ? "protocolado"
      : "elaboracao";
  }
  if (s.includes("conclu") || s.includes("deferido")) return "concluido";
  if (s.includes("recusa") || s.includes("indefer")) return "arquivado";
  if (s.includes("sobrest")) return "em_analise";
  if (s.includes("análise") || s.includes("analise")) return "em_analise";
  if (s.includes("exig") || s.includes("notifica")) return "exigencia";
  if (s.includes("aguardando")) return "protocolado";
  return tipoProcesso === "sei" || tipoProcesso === "sla"
    ? "protocolado"
    : "elaboracao";
}

/** Converte serial Excel, ISO ou texto dd/mm/aaaa para ISO date (yyyy-mm-dd). */
export function parseExcelOrTextDate(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;

  if (typeof value === "number" && Number.isFinite(value)) {
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
    return undefined;
  }

  const raw = normalizeProcessText(value);
  if (!raw) return undefined;

  const br = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    let year = br[3] ? Number(br[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const asNum = Number(raw.replace(",", "."));
  if (Number.isFinite(asNum) && asNum > 30000) {
    return parseExcelOrTextDate(asNum);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return undefined;
}

export function formatProcessDate(value: unknown): string {
  if (!value) return "—";
  try {
    const date =
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
        ? (value as { toDate: () => Date }).toDate()
        : typeof value === "string"
          ? new Date(value)
          : new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("pt-BR");
    }
  } catch {
    /* ignore */
  }
  return "—";
}

export function formatPrazoDisplay(prazo?: string): string {
  if (!prazo) return "—";
  return formatProcessDate(prazo);
}

export function officeProcessSearchBlob(process: {
  numeroProcesso: string;
  empreendedorName: string;
  empreendimentoName: string;
  municipio?: string;
  tipoIntervencao?: string;
  statusDetalhe?: string;
}): string {
  return [
    process.numeroProcesso,
    process.empreendedorName,
    process.empreendimentoName,
    process.municipio,
    process.tipoIntervencao,
    process.statusDetalhe,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
