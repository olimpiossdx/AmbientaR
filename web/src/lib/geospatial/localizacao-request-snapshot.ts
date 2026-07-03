import type { AiaImovelSnapshot } from "@/lib/intervention-checklist";
import type {
  LocalizacaoResolvida,
  RequestLocalizacaoImovel,
} from "@/lib/types/localizacao-imovel";

export function imovelResumoFromLocalizacao(
  resolved: LocalizacaoResolvida,
  selectedCarCod?: string,
) {
  const cod = selectedCarCod || resolved.imovelSelecionadoCod;
  if (cod) {
    return resolved.imoveis.find((i) => i.codImovel === cod);
  }
  return resolved.imoveis[0];
}

export function localizacaoToImovelSnapshot(
  resolved: LocalizacaoResolvida,
  current: AiaImovelSnapshot = {},
): AiaImovelSnapshot {
  const imovel = imovelResumoFromLocalizacao(resolved);
  return {
    ...current,
    codigoCar: resolved.imovelSelecionadoCod ?? imovel?.codImovel ?? current.codigoCar,
    areaTotalHa: resolved.areaHa ?? current.areaTotalHa,
  };
}

export function localizacaoToRequestSnapshot(
  resolved: LocalizacaoResolvida,
  conectaGov?: {
    areaAppHa?: number;
    areaRlHa?: number;
    consultadoEmUtc?: string;
  },
): RequestLocalizacaoImovel {
  const imovel = imovelResumoFromLocalizacao(resolved);
  const cod =
    resolved.imovelSelecionadoCod ?? imovel?.codImovel ?? "";
  return {
    codImovel: cod,
    municipio: imovel?.municipio,
    uf: imovel?.uf,
    areaHa: resolved.areaHa,
    metodoEntrada: resolved.metodoEntrada,
    perimetroFonte: resolved.perimetroFonte,
    confianca: resolved.confianca,
    confirmadoEmUtc: new Date().toISOString(),
    gpsAccuracyM: resolved.gpsAccuracyM,
    ...(conectaGov?.areaAppHa != null ? { areaAppHa: conectaGov.areaAppHa } : {}),
    ...(conectaGov?.areaRlHa != null ? { areaRlHa: conectaGov.areaRlHa } : {}),
    ...(conectaGov?.consultadoEmUtc
      ? { conectaGovConsultadoEmUtc: conectaGov.consultadoEmUtc }
      : {}),
  };
}

/** Campos para `georef_projects` após confirmação SICAR. */
export function localizacaoToGeorefPatch(resolved: LocalizacaoResolvida) {
  const imovel = imovelResumoFromLocalizacao(resolved);
  return {
    car: resolved.imovelSelecionadoCod ?? imovel?.codImovel ?? null,
    areaHa: resolved.areaHa,
    municipio: imovel?.municipio ?? null,
    uf: imovel?.uf ?? null,
    polygonGeojson: resolved.perimetroFinal,
    localizacaoImovel: localizacaoToRequestSnapshot(resolved),
  };
}

export type GeorefLocalizadorDraft = ReturnType<typeof localizacaoToGeorefPatch>;

/** Rascunho browser → dialog Novo trâmite (CAR). */
export const GEOREF_CAR_DRAFT_KEY = "georef-localizador-draft";
/** Rascunho browser → dialog Novo trâmite (campo/GPS). */
export const GEOREF_CAMPO_DRAFT_KEY = "georef-campo-localizador-draft";

export function readGeorefLocalizadorDraft(key: string): GeorefLocalizadorDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as GeorefLocalizadorDraft;
  } catch {
    return null;
  }
}

export function clearGeorefLocalizadorDrafts() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GEOREF_CAR_DRAFT_KEY);
    localStorage.removeItem(GEOREF_CAMPO_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function conectaGovExtrasFromDemonstrativo(
  demo: import("@/lib/geospatial/conecta-gov-sicar").ConectaGovDemonstrativo,
) {
  return {
    areaAppHa: demo.areaAppHa,
    areaRlHa: demo.areaRlHa,
    consultadoEmUtc: new Date().toISOString(),
  };
}
