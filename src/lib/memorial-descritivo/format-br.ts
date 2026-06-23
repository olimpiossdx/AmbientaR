/** Formata número no padrão brasileiro (milhar com ponto, decimal com vírgula). */
export function decimalBr(valor: number, casas = 3): string {
  const fixed = valor.toFixed(casas);
  const [intPart, decPart] = fixed.split(".");
  const intWithSep = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart != null ? `${intWithSep},${decPart}` : intWithSep;
}

/** Converte ângulo decimal em graus, minutos e segundos (formato memorial). */
export function grausMinSeg(angulo: number): string {
  const g = Math.floor(angulo);
  const mFloat = (angulo - g) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${g}° ${String(m).padStart(2, "0")}' ${s.toFixed(2).replace(".", ",")}''`;
}

/** Meridiano central do fuso UTM (hemisfério sul). */
export function meridianoCentralWgr(fuso: string): number {
  const zone = Number(fuso);
  if (!Number.isFinite(zone) || zone < 1 || zone > 60) return 45;
  return zone * 6 - 183;
}

export function slugifyFileName(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "imovel";
}
