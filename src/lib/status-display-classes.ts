import type { Condicionante, InsignificantWaterUseType, PermitStatus } from "@/lib/types";

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
