import { normalizeCpfCnpj } from "@/lib/cpf-cnpj";

export type CnpjLookupResult = {
  ok: boolean;
  cnpj: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  email?: string;
  phone?: string;
  address?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  cnaePrincipal?: string;
  situacaoCadastral?: string;
  source?: string;
  error?: string;
};

export async function lookupCnpjPublicData(
  rawCnpj: string,
): Promise<CnpjLookupResult> {
  const cnpj = normalizeCpfCnpj(rawCnpj);

  try {
    const res = await fetch(`/api/cnpj-lookup?cnpj=${encodeURIComponent(cnpj)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return { ok: false, cnpj, error: `HTTP ${res.status}` };
    }

    return (await res.json()) as CnpjLookupResult;
  } catch (error) {
    return {
      ok: false,
      cnpj,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
