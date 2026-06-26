# ADR — Catálogo geoespacial AmbientaR

**Data:** 2026-06-11  
**Status:** Aceite (Fase P0–P7)

## Contexto

Integração com dezenas de fontes (IDE-Sisema, IBAMA, SICAR, MMA, ANA, MTR) exige um catálogo único consumido pelo motor de interseção.

## Decisão

1. **Fase atual:** catálogo em TypeScript (`wave-a-catalog.ts`, `wave-federal-catalog.ts`, `wave-mma-catalog.ts`, `wave-icmbio-catalog.ts`).
2. **Metadados:** GeoNetwork REST + CSW apenas para **descoberta e sync** (`scripts/sync-geo-catalog.ts`); não substituir catálogo runtime sem revisão humana.
3. **Persistência factual:** JSON em `geo_analyses` (Firestore) + sessão `__session_current__`.
4. **APIs com credencial** (MTR, SICAR Gov.br): proxy server-side em `/api/*`; segredos só em App Hosting / `.env.local`.

## Consequências

- Adicionar camada = editar TS + correr `npm run geo:probe`.
- Migração futura para Firestore `geo_layer_catalog` opcional quando >80 camadas estáveis.
