/**
 * Integração Conecta Gov — SICAR Imóvel / Demonstrativo (L5, D7).
 * Requer credenciais de órgão público; desativado por omissão.
 *
 * Documentação: https://www.gov.br/conecta/catalogo/apis/sicar-imoveis
 */

export type ConectaGovConfig = {
  enabled: boolean;
  baseUrl: string;
  clientId?: string;
  clientSecret?: string;
};

export type ConectaGovDemonstrativo = {
  codImovel: string;
  areaTotalHa?: number;
  areaAppHa?: number;
  areaRlHa?: number;
  status?: string;
  condicao?: string;
  municipio?: string;
  uf?: string;
  raw?: Record<string, unknown>;
};

export function getConectaGovConfig(): ConectaGovConfig {
  const enabled = process.env.CONECTA_GOV_SICAR_ENABLED === "true";
  return {
    enabled,
    baseUrl:
      process.env.CONECTA_GOV_SICAR_BASE_URL?.trim() ||
      "https://api.conecta.gov.br",
    clientId: process.env.CONECTA_GOV_CLIENT_ID?.trim(),
    clientSecret: process.env.CONECTA_GOV_CLIENT_SECRET?.trim(),
  };
}

export function isConectaGovConfigured(): boolean {
  const cfg = getConectaGovConfig();
  return Boolean(cfg.enabled && cfg.clientId && cfg.clientSecret);
}

/**
 * Consulta demonstrativo CAR via Conecta Gov (OAuth client credentials).
 * Lança erro descritivo se credenciais ausentes ou API indisponível.
 */
export async function fetchConectaGovDemonstrativo(
  codImovel: string,
): Promise<ConectaGovDemonstrativo> {
  const cfg = getConectaGovConfig();
  if (!cfg.enabled) {
    throw new Error(
      "Conecta Gov desativado. Defina CONECTA_GOV_SICAR_ENABLED=true e credenciais.",
    );
  }
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error(
      "Credenciais Conecta Gov ausentes (CONECTA_GOV_CLIENT_ID / CONECTA_GOV_CLIENT_SECRET).",
    );
  }

  const tokenRes = await fetch(`${cfg.baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(
      `Conecta Gov OAuth falhou (HTTP ${tokenRes.status}). Verifique credenciais.`,
    );
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error("Conecta Gov OAuth não devolveu access_token.");
  }

  const demoRes = await fetch(
    `${cfg.baseUrl}/sicar/v1/imoveis/${encodeURIComponent(codImovel)}/demonstrativo`,
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    },
  );

  if (!demoRes.ok) {
    throw new Error(
      `Conecta Gov demonstrativo falhou (HTTP ${demoRes.status}) para ${codImovel}.`,
    );
  }

  const raw = (await demoRes.json()) as Record<string, unknown>;
  return {
    codImovel,
    areaTotalHa: num(raw, "areaTotalHa", "area_total_ha", "area"),
    areaAppHa: num(raw, "areaAppHa", "area_app_ha", "app"),
    areaRlHa: num(raw, "areaRlHa", "area_rl_ha", "rl"),
    status: str(raw, "status", "statusImovel", "status_imovel"),
    condicao: str(raw, "condicao", "condicaoCadastro"),
    municipio: str(raw, "municipio", "nomeMunicipio"),
    uf: str(raw, "uf"),
    raw,
  };
}

function num(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v.replace(",", "."));
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

function str(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}
