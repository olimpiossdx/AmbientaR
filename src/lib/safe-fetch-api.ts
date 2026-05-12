/**
 * Chamadas resilientes a rotas internas `/api/*` (retry com backoff exponencial).
 * Não altera o contrato de `fetch`: devolve `Response` para o chamador fazer `json()` etc.
 */
export type FetchApiWithRetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  signal?: AbortSignal;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableHttpStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const m = err.message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("aborted")
  );
}

/**
 * `fetch` com até `maxRetries` re tentativas após falha de rede ou HTTP retriável.
 * Por omissão só re tenta em erros de rede (ex.: offline momentâneo) e 429/502/503/504.
 */
export async function fetchApiWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchApiWithRetryOptions,
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 500;
  const mergedInit: RequestInit = {
    ...init,
    signal: options?.signal ?? init?.signal,
  };

  let lastResponse: Response | null = null;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(input, mergedInit);
      lastResponse = res;
      if (res.ok || !isRetriableHttpStatus(res.status) || attempt === maxRetries) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries || !isNetworkError(e)) {
        throw e;
      }
    }
    await sleep(baseDelayMs * 2 ** attempt);
  }

  if (lastResponse) return lastResponse;
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
