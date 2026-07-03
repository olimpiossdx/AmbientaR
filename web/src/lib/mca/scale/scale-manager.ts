/** Perfis de escala Pimenta (v2). */
export type McaScaleProfile = {
  id: string;
  label: string;
  scale: string;
  scaleDenominator: number;
  insetScale: string;
  insetDenominator: number;
};

export const MCA_SCALE_PROFILES: Record<string, McaScaleProfile> = {
  pimenta_12k: {
    id: "pimenta_12k",
    label: "Uso e ocupação (padrão)",
    scale: "1:12.000",
    scaleDenominator: 12_000,
    insetScale: "1:48.000",
    insetDenominator: 48_000,
  },
  pimenta_5k: {
    id: "pimenta_5k",
    label: "Detalhe fundiário",
    scale: "1:5.000",
    scaleDenominator: 5_000,
    insetScale: "1:25.000",
    insetDenominator: 25_000,
  },
  pimenta_50k: {
    id: "pimenta_50k",
    label: "Contexto regional",
    scale: "1:50.000",
    scaleDenominator: 50_000,
    insetScale: "1:250.000",
    insetDenominator: 250_000,
  },
};

export function parseScaleDenominator(scale?: string): number {
  const m = scale?.match(/1\s*:\s*([\d.]+)/);
  if (!m) return 12_000;
  const raw = m[1].replace(/\./g, "");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 12_000;
}

export function resolveScaleProfile(scale?: string): McaScaleProfile {
  const d = parseScaleDenominator(scale);
  if (d <= 6_000) return MCA_SCALE_PROFILES.pimenta_5k;
  if (d >= 30_000) return MCA_SCALE_PROFILES.pimenta_50k;
  return MCA_SCALE_PROFILES.pimenta_12k;
}
