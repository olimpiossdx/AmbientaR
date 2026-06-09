import { NextResponse } from "next/server";
import { normalizeCpfCnpj, isValidCnpj } from "@/lib/cpf-cnpj";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cnpj = normalizeCpfCnpj(searchParams.get("cnpj"));

  if (!isValidCnpj(cnpj)) {
    return NextResponse.json(
      { ok: false, cnpj, error: "CNPJ inválido" },
      { status: 400 },
    );
  }

  try {
    const providerUrl = process.env.CNPJ_LOOKUP_PROVIDER_URL;

    if (!providerUrl) {
      return NextResponse.json({
        ok: false,
        cnpj,
        error: "CNPJ lookup provider não configurado",
      });
    }

    const url = providerUrl.replace("{cnpj}", cnpj);
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

    if (!response.ok) {
      return NextResponse.json({
        ok: false,
        cnpj,
        error: `Provider HTTP ${response.status}`,
      });
    }

    const data = (await response.json()) as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      cnpj,
      razaoSocial:
        (data.razao_social as string | undefined) ??
        (data.nome as string | undefined) ??
        (data.name as string | undefined),
      nomeFantasia:
        (data.nome_fantasia as string | undefined) ??
        (data.fantasia as string | undefined),
      email: data.email as string | undefined,
      phone:
        (data.telefone as string | undefined) ??
        (data.phone as string | undefined),
      address: data.logradouro as string | undefined,
      numero: data.numero as string | undefined,
      complemento: data.complemento as string | undefined,
      bairro: data.bairro as string | undefined,
      municipio: data.municipio as string | undefined,
      uf: data.uf as string | undefined,
      cep: data.cep as string | undefined,
      cnaePrincipal:
        (data.cnae_fiscal_descricao as string | undefined) ??
        (
          data.atividade_principal as { text?: string }[] | undefined
        )?.[0]?.text,
      situacaoCadastral:
        (data.situacao as string | undefined) ??
        (data.descricao_situacao_cadastral as string | undefined),
      source: "configured-provider",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      cnpj,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}
