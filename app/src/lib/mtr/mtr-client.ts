/**
 * Cliente MTR-MG (SEMAD/FEAM) — P7.
 * Manual: semad.mg.gov.br — Web Service Sistema MTR-MG.
 * Credenciais apenas no servidor (env).
 */

export type MtrConfig = {
  baseUrl: string;
  chaveFeam: string;
};

export type MtrTokenRequest = {
  pessoaCodigo: number;
  pessoaCnpj: string;
  usuarioCpf: string;
  senha: string;
};

export type MtrTokenResponse = {
  token?: string;
  [key: string]: unknown;
};

function getMtrConfigFromEnv(): MtrConfig | null {
  const baseUrl =
    process.env.MTR_API_BASE?.trim() ||
    (process.env.MTR_USE_HOMOLOG === "true"
      ? "https://homologa.mtr.meioambiente.mg.gov.br/api"
      : "https://mtr.meioambiente.mg.gov.br/api");
  const chaveFeam = process.env.MTR_CHAVE_FEAM?.trim();
  if (!chaveFeam) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), chaveFeam };
}

export function isMtrConfigured(): boolean {
  return getMtrConfigFromEnv() !== null;
}

export async function mtrGetToken(
  credentials: MtrTokenRequest,
): Promise<MtrTokenResponse> {
  const cfg = getMtrConfigFromEnv();
  if (!cfg) {
    throw new Error(
      "MTR não configurado. Defina MTR_CHAVE_FEAM (e opcionalmente MTR_API_BASE) no servidor.",
    );
  }

  const res = await fetch(`${cfg.baseUrl}/gettoken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MTR gettoken HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<MtrTokenResponse>;
}

export async function mtrPost<T>(
  path: string,
  token: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const cfg = getMtrConfigFromEnv();
  if (!cfg) {
    throw new Error("MTR não configurado no servidor.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${cfg.baseUrl}${normalizedPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      chave_feam: cfg.chaveFeam,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MTR ${path} HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/pdf")) {
    const buf = await res.arrayBuffer();
    return { pdfBase64: Buffer.from(buf).toString("base64") } as T;
  }

  return res.json() as Promise<T>;
}
