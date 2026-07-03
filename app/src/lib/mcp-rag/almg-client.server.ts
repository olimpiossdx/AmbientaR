const DEFAULT_BASE = "https://dadosabertos.almg.gov.br";
const MIN_INTERVAL_MS = 1100;

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export function getAlmgOpenDataBaseUrl(): string {
  return process.env.ALMG_OPEN_DATA_BASE_URL?.trim() || DEFAULT_BASE;
}

export async function fetchAlmgJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  const base = getAlmgOpenDataBaseUrl().replace(/\/$/, "");
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  await throttle();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Prova conectividade com API v2 (respeita limite de 1 req/s da ALMG). */
export async function probeAlmgApiV2(): Promise<{
  reachable: boolean;
  endpoint: string;
  sampleKeys: string[];
  error?: string;
}> {
  const endpoint = "/api/v2/pronunciamentos/tipos";
  const result = await fetchAlmgJson<Record<string, unknown>>(endpoint);
  if (!result.ok || !result.data) {
    return {
      reachable: false,
      endpoint,
      sampleKeys: [],
      error: result.error,
    };
  }
  return {
    reachable: true,
    endpoint,
    sampleKeys: Object.keys(result.data),
  };
}

export const ALMG_LEGISLATION_CSV_DOC =
  "https://dadosabertos.almg.gov.br/documentacao/arquivos/legislacao-mineira";
