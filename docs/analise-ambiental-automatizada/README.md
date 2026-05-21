# Análise ambiental automatizada — documentação de refinamento

Pasta de **discussão e planeamento** (não substitui código). Serve para retomar o refinamento do módulo **Análise Geoespacial (IA)** (`/analise-ambiental`) e da visão de relatórios automatizados para estudos ambientais.

## Documentos

| Ficheiro | Conteúdo |
|----------|----------|
| [PLANO-ONDA-A-E-ETAPA-2.md](./PLANO-ONDA-A-E-ETAPA-2.md) | **Em curso:** Onda A (hidrografia, bioma, solos) → validar → Etapa 2 (IA) |
| [ETAPA-1-E-ETAPA-2.md](./ETAPA-1-E-ETAPA-2.md) | **Acordado:** MVP SIG (PDF factual) → Relatórios de IA (complemento PDF/Word) → estudos técnicos |
| [MVP-CAMADAS-IDE-SISEMA-MG.md](./MVP-CAMADAS-IDE-SISEMA-MG.md) | 8 camadas MG (hidrografia, solos, bioma, inventário florestal, geologia, geomorfologia, pedologia, fauna) + ondas e métricas |
| [VISAO-E-ROADMAP.md](./VISAO-E-ROADMAP.md) | Sonho do produto, fases 0–5, decisões de produto, arquitetura mental |
| [COLIGACAO-DADOS-PUBLICOS.md](./COLIGACAO-DADOS-PUBLICOS.md) | Como a plataforma pode buscar dados públicos, o que é fácil/difícil, etapa até ao relatório factual |
| [DISCUSSAO-2026-05-21.md](./DISCUSSAO-2026-05-21.md) | Registo da conversa inicial (refinamento, cards por camada, integração futura com estudos) |

## Código e docs relacionados no repo

- UI: `src/app/(app)/analise-ambiental/`
- API factual: `src/app/api/geospatial/analyze/route.ts`
- Serviço SIG (MVP): `src/lib/geospatial/geo-analysis-service.ts`
- Fluxo IA: `src/ai/flows/analise-ambiental-flow.ts`
- Inventário de fontes: `docs/INVENTARIO-SIG-MG-UNIAO-ANALISE-GEOESPACIAL.md`
- Arquitetura IA/relatórios: `docs/ARQUITETURA-IA-E-RELATORIOS.md`
- Worker SHP/KML (plano): `.cursor/plans/mapas-geoprocessing-opcao-b.md`, `infra/geo-export-worker/`

## Princípio acordado

1. **Etapa 1 — SIG:** interseção, área, % dentro do perímetro, PDF com mapas — rastreável, auditável (`/analise-ambiental`).  
2. **Etapa 2 — IA:** complementação textual a partir do pacote salvo — rascunho para **revisão humana**, export PDF/Word (`/ai-lab/automations`).  
3. **Estudos técnicos:** puxam números da Etapa 1 e texto aprovado (ou rascunho) da Etapa 2.

Não é a arquitetura ideal de longo prazo; é a **mais viável agora**.

**Prioridade actual:** Onda A → Etapa 2. Ondas B/C depois.

Última atualização: 2026-05-21.
