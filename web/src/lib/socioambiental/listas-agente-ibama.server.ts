import { normalizeCpfCnpj } from "@/lib/cpf-cnpj";
import { PAMGIA_EMBARGOS_LAYER_URL } from "@/lib/geospatial/wave-federal-catalog";
import type { ListaAgenteHit, ListaAgenteRegistro } from "@/lib/socioambiental/listas-agente-types";

const IBAMA_LAYER = PAMGIA_EMBARGOS_LAYER_URL.replace(/\/$/, "");

type IbamaAttrs = Record<string, unknown>;

function attr(attrs: IbamaAttrs, ...keys: string[]): string {
  for (const key of keys) {
    const v = attrs[key];
    if (v !== undefined && v !== null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

function documentMatchesField(fieldValue: string, digits: string): boolean {
  const normalized = normalizeCpfCnpj(fieldValue);
  if (!normalized) return false;
  return normalized === digits;
}

async function queryIbamaByDocument(
  digits: string,
): Promise<{ ok: boolean; features: IbamaAttrs[]; error?: string }> {
  const base = IBAMA_LAYER.replace(/\/query\/?$/i, "");
  const url = new URL(`${base}/query`);
  url.searchParams.set("where", `cpf_cnpj_i LIKE '%${digits}%'`);
  url.searchParams.set("outFields", "*");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");
  url.searchParams.set("resultRecordCount", "25");

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "AmbientaR/1.0 (consultoria ambiental; IBAMA lista)",
      },
    });

    if (!response.ok) {
      return { ok: false, features: [], error: `IBAMA HTTP ${response.status}` };
    }

    const json = (await response.json()) as {
      features?: { attributes: IbamaAttrs }[];
      error?: { message?: string };
    };

    if (json.error?.message) {
      return { ok: false, features: [], error: json.error.message };
    }

    const matched = (json.features ?? [])
      .map((f) => f.attributes)
      .filter((a) => documentMatchesField(attr(a, "cpf_cnpj_i"), digits));

    return { ok: true, features: matched };
  } catch (e) {
    return {
      ok: false,
      features: [],
      error: e instanceof Error ? e.message : "falha de rede IBAMA",
    };
  }
}

function featuresToRegistros(features: IbamaAttrs[]): ListaAgenteRegistro[] {
  return features.slice(0, 8).map((a) => ({
    rotulo: attr(a, "nom_pessoa") || "Embargo IBAMA",
    data: attr(a, "data_tad", "data_cadas") || undefined,
    uf: attr(a, "sig_uf", "cod_uf") || undefined,
  }));
}

function hitFromFeatures(
  criterioId: string,
  label: string,
  digits: string,
  features: IbamaAttrs[],
  emptyMessage: string,
): ListaAgenteHit {
  const consultadoEmUtc = new Date().toISOString();
  const fonte = {
    nome: "IBAMA PAMGIA (SISCOM)",
    url: IBAMA_LAYER,
    consultadoEmUtc,
  };

  if (!features.length) {
    return {
      criterioId,
      resultado: "Apto",
      detalhe: emptyMessage,
      fonte,
    };
  }

  const tad = attr(features[0]!, "numero_tad");
  return {
    criterioId,
    resultado: "Inapto",
    detalhe: `${label}: ${features.length} registro(s) para o documento${tad ? ` (ex.: TAD ${tad})` : ""}.`,
    fonte,
    registros: featuresToRegistros(features),
  };
}

export async function consultarIbamaEmbargoLista(
  documento: string,
): Promise<ListaAgenteHit> {
  const digits = normalizeCpfCnpj(documento);
  const consultadoEmUtc = new Date().toISOString();
  const fonte = {
    nome: "IBAMA PAMGIA (SISCOM)",
    url: IBAMA_LAYER,
    consultadoEmUtc,
  };

  if (digits.length !== 11 && digits.length !== 14) {
    return {
      criterioId: "ibama_embargo_lista",
      resultado: "Não Analisado",
      detalhe: "CPF/CNPJ do agente inválido ou não informado.",
      fonte,
    };
  }

  const query = await queryIbamaByDocument(digits);
  if (!query.ok) {
    return {
      criterioId: "ibama_embargo_lista",
      resultado: "Não Analisado",
      detalhe: query.error ?? "Falha ao consultar embargos IBAMA por documento.",
      fonte,
    };
  }

  return hitFromFeatures(
    "ibama_embargo_lista",
    "Embargo IBAMA (lista)",
    digits,
    query.features,
    "Nenhum embargo IBAMA vinculado ao CPF/CNPJ na base SISCOM.",
  );
}

export async function consultarIbamaAutuacoesLista(
  documento: string,
): Promise<ListaAgenteHit> {
  const digits = normalizeCpfCnpj(documento);
  const consultadoEmUtc = new Date().toISOString();
  const fonte = {
    nome: "IBAMA PAMGIA (SISCOM — autos)",
    url: IBAMA_LAYER,
    consultadoEmUtc,
  };

  if (digits.length !== 11 && digits.length !== 14) {
    return {
      criterioId: "ibama_autuacoes_lista",
      resultado: "Não Analisado",
      detalhe: "CPF/CNPJ do agente inválido ou não informado.",
      fonte,
    };
  }

  const query = await queryIbamaByDocument(digits);
  if (!query.ok) {
    return {
      criterioId: "ibama_autuacoes_lista",
      resultado: "Não Analisado",
      detalhe: query.error ?? "Falha ao consultar autuações IBAMA.",
      fonte,
    };
  }

  const autuacoes = query.features.filter((a) =>
    Boolean(attr(a, "num_auto_i", "numero_tad")),
  );

  return hitFromFeatures(
    "ibama_autuacoes_lista",
    "Autuação IBAMA",
    digits,
    autuacoes,
    "Nenhuma autuação IBAMA vinculada ao CPF/CNPJ na base consultada.",
  );
}
