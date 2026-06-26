import { fetchCarByCodImovel } from "@/lib/geospatial/sicar-car-service";
import type { SicarCarQueryResult, SicarCarRecord } from "@/lib/types/sicar-car";

const TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  imoveis: SicarCarRecord[];
  fonte: SicarCarQueryResult["fonte"];
};

const cache = new Map<string, CacheEntry>();

export async function fetchCarByCodImovelCached(
  codImovel: string,
): Promise<SicarCarQueryResult> {
  const key = codImovel.trim();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return {
      ok: hit.imoveis.length > 0,
      imoveis: hit.imoveis,
      resumo:
        hit.imoveis.length > 0
          ? `${hit.imoveis[0].codImovel} · ${hit.imoveis[0].situacao}`
          : "CAR não encontrado (cache).",
      fonte: { ...hit.fonte, queriedAtUtc: new Date().toISOString() },
    };
  }

  const result = await fetchCarByCodImovel(key);
  if (result.ok && result.imoveis.length > 0) {
    cache.set(key, {
      expiresAt: Date.now() + TTL_MS,
      imoveis: result.imoveis,
      fonte: result.fonte,
    });
  }
  return result;
}

/** Limpa cache (testes). */
export function clearSicarCarCache(): void {
  cache.clear();
}
