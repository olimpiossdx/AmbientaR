import { normalizeCpfCnpj } from "@/lib/cpf-cnpj";
import { ICMBIO_WFS_BASE } from "@/lib/geospatial/wave-icmbio-catalog";
import { fetchWfsFeaturesWithCql } from "@/lib/geospatial/wfs-client";
import type { ListaAgenteHit, ListaAgenteRegistro } from "@/lib/socioambiental/listas-agente-types";

type IcmbioAttrs = Record<string, unknown>;

function attr(attrs: IcmbioAttrs, ...keys: string[]): string {
  for (const key of keys) {
    const v = attrs[key];
    if (v !== undefined && v !== null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return "";
}

function escapeCqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

function featuresToRegistros(features: IcmbioAttrs[]): ListaAgenteRegistro[] {
  return features.slice(0, 8).map((a) => ({
    rotulo: attr(a, "autuado") || attr(a, "nome_uc") || "Embargo ICMBio",
    data: attr(a, "data", "ano") || undefined,
    uf: attr(a, "uf") || undefined,
  }));
}

export async function consultarIcmbioEmbargoLista(
  documento: string,
): Promise<ListaAgenteHit> {
  const digits = normalizeCpfCnpj(documento);
  const consultadoEmUtc = new Date().toISOString();
  const fonte = {
    nome: "ICMBio (INDE WFS — embargos)",
    url: ICMBIO_WFS_BASE,
    consultadoEmUtc,
  };

  if (digits.length !== 11 && digits.length !== 14) {
    return {
      criterioId: "icmbio_embargo_lista",
      resultado: "Não Analisado",
      detalhe: "CPF/CNPJ do agente inválido ou não informado.",
      fonte,
    };
  }

  const query = await fetchWfsFeaturesWithCql({
    baseUrl: ICMBIO_WFS_BASE,
    typeName: "ICMBio:embargos_icmbio",
    cqlFilter: `cpf_cnpj LIKE '%${escapeCqlLiteral(digits)}%'`,
    maxFeatures: 25,
  });

  if (!query.ok) {
    return {
      criterioId: "icmbio_embargo_lista",
      resultado: "Não Analisado",
      detalhe: query.error ?? "Falha ao consultar embargos ICMBio por documento.",
      fonte,
    };
  }

  const features = query.features
    .map((f) => f.properties ?? {})
    .filter((a) => {
      const doc = normalizeCpfCnpj(attr(a as IcmbioAttrs, "cpf_cnpj"));
      return doc === digits;
    }) as IcmbioAttrs[];

  if (!features.length) {
    return {
      criterioId: "icmbio_embargo_lista",
      resultado: "Apto",
      detalhe: "Nenhum embargo ICMBio vinculado ao CPF/CNPJ na base INDE.",
      fonte,
    };
  }

  const numero = attr(features[0]!, "numero_emb", "numero_ai");
  return {
    criterioId: "icmbio_embargo_lista",
    resultado: "Inapto",
    detalhe: `Embargo ICMBio (lista): ${features.length} registro(s) para o documento${numero ? ` (ex.: ${numero})` : ""}.`,
    fonte,
    registros: featuresToRegistros(features),
  };
}
