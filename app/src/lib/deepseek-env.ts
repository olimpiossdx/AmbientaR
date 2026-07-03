/**
 * Variáveis DeepSeek — só em runtime de servidor (Route Handlers, Server Actions).
 * Defina `DEEPSEEK_API_KEY` em `.env.local` (nunca em código versionado).
 */
export function getDeepseekApiKey(): string | undefined {
  const k = process.env.DEEPSEEK_API_KEY?.trim();
  return k && k.length > 0 ? k : undefined;
}

export function requireDeepseekApiKey(): string {
  const k = getDeepseekApiKey();
  if (!k) {
    throw new Error(
      "DEEPSEEK_API_KEY não definida. Adicione-a em `.env.local` e reinicie `npm run dev`.",
    );
  }
  return k;
}
