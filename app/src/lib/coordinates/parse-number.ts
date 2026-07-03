/** Converte string de formulário (vírgula ou ponto) em número finito. */
export function parseCoordinateNumber(
  value: string | number | null | undefined,
): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** UTM inteiro (6 ou 7 dígitos) a partir de string de formulário. */
export function parseUtmInteger(
  value: string | number | null | undefined,
): number | undefined {
  const n = parseCoordinateNumber(value);
  if (n == null) return undefined;
  return Math.round(n);
}
