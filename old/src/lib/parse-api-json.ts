/** Lê corpo JSON de respostas `/api/*` com mensagem clara se vier vazio ou inválido. */
export async function parseApiJsonResponse<T = Record<string, unknown>>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      `Resposta vazia do servidor (HTTP ${res.status}). ` +
        "Confira credenciais Firebase Admin (config/firebase-service-account.json) e reinicie npm run dev.",
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Resposta inválida do servidor (HTTP ${res.status}): ${text.slice(0, 240)}`,
    );
  }
}
