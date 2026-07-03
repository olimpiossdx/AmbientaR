import { NextResponse } from "next/server";
import { isMtrConfigured, mtrGetToken } from "@/lib/mtr/mtr-client";
import type { MtrTokenRequest } from "@/lib/mtr/mtr-client";
import { requireAuthenticatedApi, apiAuthErrorResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** Obtém token MTR-MG (credenciais do gerador/destinador; não persiste senha no servidor). */
export async function POST(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  if (!isMtrConfigured()) {
    return NextResponse.json(
      {
        error:
          "MTR não configurado. Defina MTR_CHAVE_FEAM nas variáveis do servidor.",
      },
      { status: 503 },
    );
  }

  let body: MtrTokenRequest;
  try {
    body = (await req.json()) as MtrTokenRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (
    !body?.pessoaCodigo ||
    !body?.pessoaCnpj?.trim() ||
    !body?.usuarioCpf?.trim() ||
    !body?.senha
  ) {
    return NextResponse.json(
      {
        error:
          "pessoaCodigo, pessoaCnpj, usuarioCpf e senha são obrigatórios.",
      },
      { status: 400 },
    );
  }

  try {
    const data = await mtrGetToken({
      pessoaCodigo: Number(body.pessoaCodigo),
      pessoaCnpj: body.pessoaCnpj.replace(/\D/g, ""),
      usuarioCpf: body.usuarioCpf.replace(/\D/g, ""),
      senha: body.senha,
    });
    return NextResponse.json({
      token: data.token,
      retornoCodigo: data.retornoCodigo,
      retorno: data.retorno,
      pessoaNome: data.pessoaNome,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro MTR gettoken";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
