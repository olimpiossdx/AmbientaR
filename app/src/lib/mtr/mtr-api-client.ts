import type { MtrTokenRequest } from "@/lib/mtr/mtr-client";

export type MtrCdfListItem = {
  cdfCodigo?: number;
  cdfDataEmissao?: number;
  cdfDataInicial?: number;
  cdfDataFinal?: number;
  listaMtr?: number[];
};

export type MtrConsultaCdfResponse = {
  retornoCodigo?: number;
  retorno?: string;
  listaCdfDTO?: MtrCdfListItem[];
};

export type MtrCodigosBarrasResponse = {
  retornoCodigo?: number;
  retorno?: string;
  codigos?: string[];
};

export type MtrTokenApiResponse = {
  token?: string;
  retornoCodigo?: number;
  retorno?: string;
  error?: string;
};

async function mtrApiFetch<T>(
  path: string,
  authToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function fetchMtrSessionToken(
  sessionToken: string,
  credentials: MtrTokenRequest,
): Promise<string> {
  const json = await mtrApiFetch<MtrTokenApiResponse>("/api/mtr/token", sessionToken, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  if (!json.token) {
    throw new Error(json.retorno || json.error || "Token MTR não retornado.");
  }
  return json.token;
}

export async function mtrProxyPost<T>(
  sessionToken: string,
  mtrToken: string,
  path: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  const json = await mtrApiFetch<{ success?: boolean; data?: T; error?: string }>(
    "/api/mtr/proxy",
    sessionToken,
    {
      method: "POST",
      body: JSON.stringify({ token: mtrToken, path, payload }),
    },
  );
  if (!json.success || json.data === undefined) {
    throw new Error(json.error || "Resposta MTR inválida.");
  }
  return json.data;
}

export async function fetchMtrPdfBase64(
  sessionToken: string,
  mtrToken: string,
  path: string,
): Promise<string> {
  const data = await mtrProxyPost<{ pdfBase64?: string }>(
    sessionToken,
    mtrToken,
    path,
  );
  if (!data.pdfBase64) {
    throw new Error("PDF não retornado pela API MTR.");
  }
  return data.pdfBase64;
}
