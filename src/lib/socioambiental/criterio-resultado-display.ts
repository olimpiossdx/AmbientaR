import type { ResultadoCriterioStatus } from "@/lib/types/analise-socioambiental";

/** Cor RGB para PDF (jspdf-autotable). */
export function criterioResultadoFillColor(
  resultado: ResultadoCriterioStatus | string,
): [number, number, number] {
  if (resultado === "Apto") return [34, 139, 34];
  if (resultado === "Alerta") return [202, 138, 4];
  if (resultado === "Inapto") return [185, 28, 28];
  return [100, 116, 139];
}

export type CriterioBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

export function criterioBadgeVariant(
  resultado: ResultadoCriterioStatus | string,
): CriterioBadgeVariant {
  if (resultado === "Apto") return "default";
  if (resultado === "Inapto") return "destructive";
  return "secondary";
}

/** Classes Tailwind para estado Alerta (amarelo) — usar com Badge variant outline. */
export function criterioBadgeClassName(
  resultado: ResultadoCriterioStatus | string,
): string | undefined {
  if (resultado === "Alerta") {
    return "border-amber-500/60 bg-amber-500/15 text-amber-950 dark:text-amber-100";
  }
  return undefined;
}
