import type { GeoLayerStat } from "@/lib/types/geo-wave-a";

/** Rótulos CECAV / IDE que indicam critério locacional DN 217 (peso 1). */
const ALTO_MUITO_ALTO = /muito\s*alto|muito_alto|muito-alto|^alto$/i;

export function isPotencialAltoOuMuitoAlto(label: string): boolean {
  const n = label.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
  if (/muito/.test(n) && /alto/.test(n)) return true;
  if (/\balto\b/.test(n) && !/\bbaixo\b/.test(n) && !/\bmedio\b/.test(n)) return true;
  return ALTO_MUITO_ALTO.test(label);
}

export type CavidadesTriagemFromGeo = {
  potencialCecav: "nao_aplicavel" | "baixo" | "medio" | "alto" | "muito_alto" | "misto";
  criterioLocacionalIncide: boolean;
  observacoesIde: string;
  generatedAtUtc: string;
};

export function inferTriagemFromPotencialStats(
  stats: GeoLayerStat[],
  layerSummary: string,
  perimeterAreaHa: number,
): CavidadesTriagemFromGeo {
  const generatedAtUtc = new Date().toISOString();
  if (!stats.length) {
    return {
      potencialCecav: "nao_aplicavel",
      criterioLocacionalIncide: false,
      observacoesIde: [
        "Consulta WFS à camada de potencialidade CECAV (IDE-Sisema) sem interseção no perímetro.",
        "Confirme no Geovisualizador IDE-Sisema / mapa CECAV 1:2.500.000 e registre prospecção conforme IS 08/2017.",
        layerSummary,
      ].join(" "),
      generatedAtUtc,
    };
  }

  const altoLabels = stats.filter((s) => isPotencialAltoOuMuitoAlto(s.label));
  const muitoAlto = stats.some((s) => /muito/i.test(s.label) && /alto/i.test(s.label));
  const apenasAlto = altoLabels.length > 0 && !muitoAlto;

  let potencialCecav: CavidadesTriagemFromGeo["potencialCecav"] = "medio";
  if (muitoAlto && stats.length > 1) potencialCecav = "misto";
  else if (muitoAlto) potencialCecav = "muito_alto";
  else if (apenasAlto) potencialCecav = "alto";
  else if (stats.every((s) => /baixo/i.test(s.label))) potencialCecav = "baixo";
  else potencialCecav = "medio";

  const criterioLocacionalIncide = altoLabels.length > 0;
  const top = stats[0];
  const pct = top?.pctOfPerimeter ?? 0;

  const observacoesIde = [
    `Área do empreendimento: ${perimeterAreaHa.toFixed(2)} ha.`,
    layerSummary,
    criterioLocacionalIncide
      ? `Critério locacional DN 217/2017 (cavidades, peso 1): classes alto/muito alto no recorte (${altoLabels.map((s) => s.label).join(", ")}).`
      : "Sem classe alto/muito alto de potencialidade CECAV no recorte WFS — critério locacional de cavidades provavelmente não incide (confirmar no órgão).",
    pct > 0 ? `Classe predominante no perímetro: "${top.label}" (${pct}% da ADA).` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    potencialCecav,
    criterioLocacionalIncide,
    observacoesIde,
    generatedAtUtc,
  };
}

export const CAVIDADES_POTENCIAL_LAYER_ID = "mg_potencial_cavidades";

export function enrichPotencialCavidadesLayerSummary(
  stats: GeoLayerStat[],
  baseSummary: string,
  perimeterAreaHa = 0,
): string {
  if (!stats.length) {
    return `${baseSummary} Para licenciamento em MG, verifique potencial CECAV no IDE-Sisema (IS 08/2017; DN 217/2017).`;
  }
  const triagem = inferTriagemFromPotencialStats(stats, baseSummary, perimeterAreaHa);
  if (triagem.criterioLocacionalIncide) {
    return `${baseSummary} Atenção: possível incidência do critério locacional de cavidades (peso 1) — exige estudo espeleológico na instrução SUPRAM.`;
  }
  return baseSummary;
}
