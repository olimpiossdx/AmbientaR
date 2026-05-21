import type {
  Condicionante,
  Inconformidade,
  InsignificantWaterUseType,
  PermitStatus,
} from "@/lib/types";

/** Níveis de criticidade de inconformidade (vistoria de campo). */
export type InconformidadeCriticality = Inconformidade["criticality"];

export const INCONFORMIDADE_CRITICALITY_LEVELS: InconformidadeCriticality[] = [
  "Baixa",
  "Média",
  "Alta",
  "Urgente",
];

const inconformidadeCriticalityBadgeRich: Record<InconformidadeCriticality, string> = {
  Baixa:
    "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  Média:
    "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  Alta:
    "bg-orange-500/20 text-orange-700 border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  Urgente:
    "bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const inconformidadeCriticalityCardRich: Record<InconformidadeCriticality, string> = {
  Baixa:
    "border-l-4 border-l-blue-500 bg-blue-500/5 border-blue-500/25 dark:bg-blue-500/10 dark:border-blue-500/30",
  Média:
    "border-l-4 border-l-yellow-500 bg-yellow-500/5 border-yellow-500/25 dark:bg-yellow-500/10 dark:border-yellow-500/30",
  Alta:
    "border-l-4 border-l-orange-500 bg-orange-500/5 border-orange-500/25 dark:bg-orange-500/10 dark:border-orange-500/30",
  Urgente:
    "border-l-4 border-l-red-500 bg-red-500/5 border-red-500/25 dark:bg-red-500/10 dark:border-red-500/30",
};

const inconformidadeCriticalityDotRich: Record<InconformidadeCriticality, string> = {
  Baixa: "bg-blue-500",
  Média: "bg-yellow-500",
  Alta: "bg-orange-500",
  Urgente: "bg-red-500",
};

export function normalizeInconformidadeCriticality(
  value?: string | null,
): InconformidadeCriticality {
  if (
    value &&
    INCONFORMIDADE_CRITICALITY_LEVELS.includes(value as InconformidadeCriticality)
  ) {
    return value as InconformidadeCriticality;
  }
  return "Média";
}

/** Badge em listagens e detalhe da vistoria. */
export function inconformidadeCriticalityBadgeClass(
  criticality?: string | null,
): string {
  return inconformidadeCriticalityBadgeRich[normalizeInconformidadeCriticality(criticality)];
}

/** Cartão / bloco de NC no formulário (borda esquerda + fundo suave). */
export function inconformidadeCriticalityCardClass(
  criticality?: string | null,
): string {
  return inconformidadeCriticalityCardRich[normalizeInconformidadeCriticality(criticality)];
}

/** Botão do select de criticidade no formulário. */
export function inconformidadeCriticalitySelectTriggerClass(
  criticality?: string | null,
): string {
  return inconformidadeCriticalityBadgeRich[normalizeInconformidadeCriticality(criticality)];
}

/** Bolinha de cor nas opções do dropdown. */
export function inconformidadeCriticalityDotClass(
  criticality: InconformidadeCriticality,
): string {
  return inconformidadeCriticalityDotRich[criticality];
}

/** RGB para jsPDF (fillColor / textColor). */
export type PdfRgb = [number, number, number];

export type InconformidadePdfCellStyle = {
  fillColor: PdfRgb;
  textColor: PdfRgb;
};

/** Status “Não conforme” — tom da criticidade, mais claro. */
const inconformidadePdfStatusNcLight: Record<
  InconformidadeCriticality,
  InconformidadePdfCellStyle
> = {
  Baixa: { fillColor: [239, 246, 255], textColor: [37, 99, 235] },
  Média: { fillColor: [254, 252, 232], textColor: [161, 98, 7] },
  Alta: { fillColor: [255, 247, 237], textColor: [194, 65, 12] },
  Urgente: { fillColor: [254, 242, 242], textColor: [185, 28, 28] },
};

/** Coluna Criticidade — mesmo tom, um pouco mais marcado. */
const inconformidadePdfCriticalityMedium: Record<
  InconformidadeCriticality,
  InconformidadePdfCellStyle
> = {
  Baixa: { fillColor: [219, 234, 254], textColor: [29, 78, 216] },
  Média: { fillColor: [254, 243, 199], textColor: [180, 83, 9] },
  Alta: { fillColor: [255, 237, 213], textColor: [194, 65, 12] },
  Urgente: { fillColor: [254, 226, 226], textColor: [185, 28, 28] },
};

export function inconformidadePdfStatusNcStyle(
  criticality?: string | null,
): InconformidadePdfCellStyle {
  return inconformidadePdfStatusNcLight[normalizeInconformidadeCriticality(criticality)];
}

export function inconformidadePdfCriticalityStyle(
  criticality?: string | null,
): InconformidadePdfCellStyle {
  return inconformidadePdfCriticalityMedium[normalizeInconformidadeCriticality(criticality)];
}

export function applyInconformidadePdfCellStyle(
  styles: {
    fillColor?: PdfRgb | string | number | false;
    textColor?: PdfRgb | string | number | false;
    fontStyle?: string | ("normal" | "bold" | "italic" | "bolditalic");
  },
  palette: InconformidadePdfCellStyle,
  bold = true,
): void {
  styles.fillColor = palette.fillColor;
  styles.textColor = palette.textColor;
  if (bold) styles.fontStyle = "bold";
}

/** Classes Tailwind para badges de status de licenças/outorgas (com dark mode). */
export const permitStatusBadgeClassRich: Record<PermitStatus, string> = {
  "V\u00e1lida":
    "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  Vencida:
    "bg-red-500/20 text-red-700 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  "Em Renova\u00e7\u00e3o":
    "bg-blue-500/20 text-blue-700 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  Suspensa:
    "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  Cancelada:
    "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  "Em Andamento":
    "bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
};

/** Classes Tailwind compactas (listagens sem variante dark extra). */
export const permitStatusBadgeClassSimple: Record<PermitStatus, string> = {
  "V\u00e1lida": "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  Vencida: "bg-red-500/20 text-red-700 border-red-500/30",
  "Em Renova\u00e7\u00e3o": "bg-blue-500/20 text-blue-700 border-blue-500/30",
  Suspensa: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  Cancelada: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  "Em Andamento": "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
};

export const condicionanteStatusBadgeClass: Record<
  Condicionante["status"],
  string
> = {
  Pendente: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  "Em execu\u00e7\u00e3o": "bg-blue-500/20 text-blue-700 border-blue-500/30",
  Cumprida: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  Atrasada: "bg-red-500/20 text-red-700 border-red-500/30",
  "N\u00e3o Aplic\u00e1vel":
    "bg-slate-500/20 text-slate-700 border-slate-500/30",
};

/** Labels de tipo de uso insignificante — alinhado a `InsignificantWaterUseType`. */
export const insignificantWaterUseOptions: {
  type: InsignificantWaterUseType;
  label: string;
}[] = [
  { type: "Po\u00e7o Tubular", label: "Po\u00e7o Tubular" },
  {
    type: "Capta\u00e7\u00e3o Superficial",
    label: "Capta\u00e7\u00e3o Superficial",
  },
  {
    type: "Capta\u00e7\u00e3o Em Barramento",
    label: "Capta\u00e7\u00e3o Em Barramento",
  },
  {
    type: "Barramento Sem Capta\u00e7\u00e3o",
    label: "Barramento Sem Capta\u00e7\u00e3o",
  },
  {
    type: "Capta\u00e7\u00e3o em Nascente",
    label: "Capta\u00e7\u00e3o em Nascente",
  },
  {
    type: "Capta\u00e7\u00e3o em Cisterna",
    label: "Capta\u00e7\u00e3o em Cisterna",
  },
];
