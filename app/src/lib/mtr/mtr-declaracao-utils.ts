/** Intervalo máximo permitido pela API MTR (1 mês). */
export function mtrLastMonthRange(): { inicio: Date; fim: Date } {
  const fim = new Date();
  fim.setHours(0, 0, 0, 0);
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - 29);
  return { inicio, fim };
}

export function formatMtrDateBr(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function formatMtrDateYmd(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${y}${m}${d}`;
}

export function mtrTipoLabel(tipo: string): string {
  switch (tipo) {
    case "cdf":
      return "CDF";
    case "manifesto":
      return "Manifesto (MTR)";
    case "declaracao":
      return "Declaração (DMR)";
    default:
      return "Documento";
  }
}

export function mtrSourceLabel(source: string): string {
  switch (source) {
    case "upload":
      return "Upload manual";
    case "api_cdf":
      return "MTR-MG (CDF)";
    case "api_manifesto":
      return "MTR-MG (manifesto)";
    default:
      return source;
  }
}

export function parseMtrTimestamp(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}
