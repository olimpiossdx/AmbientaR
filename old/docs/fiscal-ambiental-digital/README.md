# Fiscal Ambiental Digital — documentação

Produto **standalone** de acervo satelital INPE/CBERS, comparação temporal, inteligência ambiental e fiscalização preventiva.

## Documento de referência (único)

| Ficheiro | Conteúdo |
|----------|----------|
| **[PLANO-UNICO.md](./PLANO-UNICO.md)** | Plano consolidado v2.0 — visão, arquitetura, dados, APIs, workers, fases 0–7, ganhos, riscos, prompts Cursor |
| **[EVOLUCOES-V2.md](./EVOLUCOES-V2.md)** | SIG/PRODES, scheduler Cloud, worker GDAL, checklist E2E |

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
- **Estado:** Fases 0–7 + **evoluções v2** (SIG/PRODES com flag, scheduler cron, worker GDAL). Ver [EVOLUCOES-V2.md](./EVOLUCOES-V2.md).

Última atualização: 2026-06-12
