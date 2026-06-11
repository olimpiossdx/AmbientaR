import { NextResponse } from "next/server";
import { isMtrConfigured, mtrPost } from "@/lib/mtr/mtr-client";
import { requireAuthenticatedApi, apiAuthErrorResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

type Body = {
  token: string;
  path: string;
  payload?: Record<string, unknown>;
};

/**
 * Proxy genérico MTR-MG (POST autenticado). Requer MTR_CHAVE_FEAM no servidor.
 * Ex.: path = "/retornaListaClasse"
 */
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
          "MTR não configurado. Defina MTR_CHAVE_FEAM nas variáveis do servidor (ver manual SEMAD).",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body?.token || !body?.path) {
    return NextResponse.json(
      { error: "token e path são obrigatórios." },
      { status: 400 },
    );
  }

  if (!body.path.startsWith("/")) {
    return NextResponse.json({ error: "path deve começar com /." }, { status: 400 });
  }

  const allowed = [
    "/retornaListaClasse",
    "/retornaListaUnidade",
    "/retornaListaTecnologia",
    "/retornaListaEstadoFisico",
    "/retornaListaResiduo",
    "/retornaListaAcondicionamento",
    "/consultaListaCdf",
    "/retornaListaCodigoBarasManifesto",
  ];
  if (!allowed.some((p) => body.path.startsWith(p))) {
    return NextResponse.json({ error: "path MTR não permitido neste proxy." }, { status: 403 });
  }

  try {
    const data = await mtrPost(body.path, body.token, body.payload);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro MTR";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
