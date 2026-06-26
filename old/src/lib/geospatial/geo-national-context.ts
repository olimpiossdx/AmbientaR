/**
 * Contexto factual nacional (ZEE Brasil CKAN + síntese ZEE-MG) — P5.
 */

import type { GeoLayerResult } from "@/lib/types/geo-wave-a";
import {
  MMA_CKAN_API,
  MMA_CKAN_PACKAGE_ZEE,
} from "@/lib/geospatial/wave-mma-catalog";

export type GeoZeeContext = {
  mgZeeClasses: { label: string; pctOfPerimeter?: number }[];
  mgIeeResumo?: string;
  zeeBrasilTitulo: string;
  zeeBrasilNota: string;
  zeeBrasilUrl: string;
  ecossistemasNota: string;
  fetchedAtUtc: string;
};

const ZEE_BRASIL_URL = `https://dados.mma.gov.br/dataset/${MMA_CKAN_PACKAGE_ZEE}`;

const ZEE_BRASIL_FALLBACK =
  "Diretrizes de uso e ocupação por Zoneamento Ecológico-Econômico (ZEE) — cobertura e projetos estaduais no portal de dados abertos do MMA.";

const ECOSSISTEMAS_NOTA =
  "Biodiversidade e unidades de conservação consultadas via INDE/MMA (CNUC) e camadas MG (áreas prioritárias). Mapas de ecossistemas nacionais: dados.mma.gov.br e MapBiomas.";

export function buildZeeContextFromLayers(layers: GeoLayerResult[]): GeoZeeContext {
  const zee = layers.find((l) => l.layerId === "mg_zee_zonas");
  const mgZeeClasses =
    zee?.stats.map((s) => ({
      label: s.label,
      pctOfPerimeter: s.pctOfPerimeter,
    })) ?? [];

  const top = zee?.stats[0];
  const mgIeeResumo =
    zee?.status === "ok" && top
      ? `ZEE-MG (2008): classe predominante «${top.label}» (~${top.pctOfPerimeter ?? 0}% do empreendimento).`
      : zee?.status === "partial"
        ? "ZEE-MG: perímetro sem interseção mensurável com zonas ecológico-econômicas no WFS."
        : undefined;

  return {
    mgZeeClasses,
    mgIeeResumo,
    zeeBrasilTitulo: "ZEE Brasil — diretrizes MMA (CKAN)",
    zeeBrasilNota: ZEE_BRASIL_FALLBACK,
    zeeBrasilUrl: ZEE_BRASIL_URL,
    ecossistemasNota: ECOSSISTEMAS_NOTA,
    fetchedAtUtc: new Date().toISOString(),
  };
}

export async function enrichZeeContextFromCkan(
  ctx: GeoZeeContext,
): Promise<GeoZeeContext> {
  try {
    const url = `${MMA_CKAN_API}/package_show?id=${encodeURIComponent(MMA_CKAN_PACKAGE_ZEE)}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return ctx;
    const json = (await res.json()) as {
      success?: boolean;
      result?: { title?: string; notes?: string };
    };
    if (!json.success || !json.result) return ctx;
    return {
      ...ctx,
      zeeBrasilTitulo: json.result.title ?? ctx.zeeBrasilTitulo,
      zeeBrasilNota: (json.result.notes ?? ctx.zeeBrasilNota).slice(0, 600),
    };
  } catch {
    return ctx;
  }
}

export function zeeContextToFactualParagraph(ctx: GeoZeeContext): string {
  const parts: string[] = [];
  if (ctx.mgIeeResumo) parts.push(ctx.mgIeeResumo);
  parts.push(`${ctx.zeeBrasilTitulo}: ${ctx.zeeBrasilNota}`);
  parts.push(ctx.ecossistemasNota);
  return parts.join(" ");
}
