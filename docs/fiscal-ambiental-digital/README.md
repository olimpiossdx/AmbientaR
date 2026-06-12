# Fiscal Ambiental Digital — documentação

Produto **standalone** de acervo satelital INPE/CBERS, comparação temporal, inteligência ambiental e fiscalização preventiva.

## Documento de referência (único)

| Ficheiro | Conteúdo |
|----------|----------|
| **[PLANO-UNICO.md](./PLANO-UNICO.md)** | Plano consolidado v2.0 — visão, arquitetura, dados, APIs, workers, fases 0–7, ganhos, riscos, prompts Cursor |

Este ficheiro **substitui** o pacote externo de 14 documentos e o antigo `PLANO-CONSOLIDADO-IMPLANTACAO.md`.

## Complemento técnico

| Ficheiro | Conteúdo |
|----------|----------|
| [CBERS-ARQUIVO-INPE-PLANO.md](../CBERS-ARQUIVO-INPE-PLANO.md) | Detalhe GDAL/STAC (§4–11); absorvido pelo FAD na implementação |

## Relação com outros módulos

| Módulo | Relação |
|--------|---------|
| [analise-ambiental-automatizada/](../analise-ambiental-automatizada/) | Paralelo — integração SIG opcional na Fase 4 v2 |
| Resto do SaaS (CRM, licenciamento) | **Sem ligação no MVP** |

## Resumo

- **Rota:** `/ia/fiscal-ambiental-digital`
- **API:** `/api/fiscal-ambiental/*`
- **Dados:** `fad_workspaces/{id}/...`
- **MVP:** Fases 0–1 (workspace + acervo INPE + GeoTIFF)
- **Worker:** `infra/fiscal-satellite-worker` (opcional; sem URL usa modo inline na API)
- **Estado:** **Fases 0–2 implementadas** — acervo INPE (Fase 1), linha do tempo, comparador slider, timelapse, evidências guardadas. GDAL/recorte AOI real e inteligência (Fase 3) pendentes.

Última atualização: 2026-06-12
