# Plano do módulo — Financeiro

Status: análise inicial  
Diretório: `financeiro`  
Dependência de acesso do pai: `modulo.financeiro=acessar`  
Filhos mapeados: **25**

## Objetivo

Migrar o menu **Financeiro** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-FIN-001 — Acesso Bancário](fun-fin-001-acesso-bancario.md) | /app/bank-access | CRUD /bank-access |
| [FUN-FIN-002 — Clientes](fun-fin-002-clientes.md) | /app/clients, /new, /$id/edit | CRUD /financial/clients |
| [FUN-FIN-003 — Contratos](fun-fin-003-contratos.md) | /app/contracts, /new, /$id/edit | CRUD /contracts; POST /contracts/{id}/actions/{action} com approve/sign/cancel |
| [FUN-FIN-004 — Contratos da Plataforma](fun-fin-004-contratos-da-plataforma.md) | /app/financial/platform-subscription-contracts | GET /platform-contracts, GET /{id}, ações activate/suspend/cancel |
| [FUN-FIN-005 — Contratos de Fornecedores](fun-fin-005-contratos-de-fornecedores.md) | /app/contracts-suppliers | CRUD /supplier-contracts |
| [FUN-FIN-006 — Curva ABC de Clientes](fun-fin-006-curva-abc-de-clientes.md) | /app/financial/abc-curve | GET /financial/reports/abc-clients |
| [FUN-FIN-007 — Bens e Patrimônio](fun-fin-007-bens-e-patrimonio.md) | /app/financial/bens-patrimonio, /new, /$id/edit | CRUD /assets |
| [FUN-FIN-008 — DRE Contábil](fun-fin-008-dre-contabil.md) | /app/financial/dre-contabil | GET /financial/reports/income-statement |
| [FUN-FIN-009 — Faturas](fun-fin-009-faturas.md) | /app/invoices, /new, /$id/edit | CRUD /invoices; ações issue/cancel/mark-paid |
| [FUN-FIN-010 — Fornecedores](fun-fin-010-fornecedores.md) | /app/suppliers, /new, /$id/edit | CRUD /suppliers |
| [FUN-FIN-011 — Lançamentos de Caixa](fun-fin-011-lancamentos-de-caixa.md) | /app/cash-flow, /new, /$id/edit | CRUD /cash-transactions; ação reverse |
| [FUN-FIN-012 — NFe Eletrônica](fun-fin-012-nfe-eletronica.md) | /app/external?target=nfe | GET /external-targets/nfe |
| [FUN-FIN-013 — Orçamentos](fun-fin-013-orcamentos.md) | /app/proposals, /new, /$id/edit | CRUD /quotes; POST /quotes/{id}/exports |
| [FUN-FIN-014 — Orçamentos e Propostas Comerciais](fun-fin-014-orcamentos-e-propostas-comerciais.md) | /app/commercial-proposals, /new, /$id/edit | CRUD /commercial-proposals; ações send/accept/reject/expire |
| [FUN-FIN-015 — Painel Financeiro](fun-fin-015-painel-financeiro.md) | /app/financial/painel | GET /financial/dashboard |
| [FUN-FIN-016 — Projetos e ROI](fun-fin-016-projetos-e-roi.md) | /app/financial/projetos-roi, /$caseId | CRUD /roi-cases; /time-entries; ações de aprovação/estorno |
| [FUN-FIN-017 — Fluxo de Caixa Projetado](fun-fin-017-fluxo-de-caixa-projetado.md) | /app/financial/fluxo-projetado | GET /financial/reports/cash-flow-forecast |
| [FUN-FIN-018 — Conciliação Bancária](fun-fin-018-conciliacao-bancaria.md) | /app/financial/conciliacao | GET /bank-reconciliation, POST /matches, DELETE /matches/{id} |
| [FUN-FIN-019 — Diagnóstico PIX](fun-fin-019-diagnostico-pix.md) | /app/financial/billing-debug | GET /billing/diagnostics, POST /billing/charges/{id}/retry |
| [FUN-FIN-020 — Curva ABC de Serviços](fun-fin-020-curva-abc-de-servicos.md) | /app/financial/abc-servicos | GET /financial/reports/abc-services |
| [FUN-FIN-021 — Curva ABC de Fornecedores](fun-fin-021-curva-abc-de-fornecedores.md) | /app/financial/abc-fornecedores | GET /financial/reports/abc-suppliers |
| [FUN-FIN-022 — Orçamento Anual](fun-fin-022-orcamento-anual.md) | /app/financial/orcamento | CRUD /annual-budgets; ação approve |
| [FUN-FIN-023 — Exportação Contábil](fun-fin-023-exportacao-contabil.md) | /app/financial/export-contabil | POST /accounting-exports, GET /jobs/{id} |
| [FUN-FIN-024 — Assistente Financeiro](fun-fin-024-assistente-financeiro.md) | /app/studies/assistant?type=financeiro | POST /ai/assistants/financial/runs |
| [FUN-FIN-025 — Tabela de Serviços](fun-fin-025-tabela-de-servicos.md) | /app/services, /new, /$id/edit | CRUD /services |

## Regras do front-end

- [ ] Criar uma fronteira de módulo com arquivo de registro, rotas lazy, navegação, tipos compartilhados e exports públicos mínimos.
- [ ] Exibir o menu pai somente quando a sessão possuir a capacidade do pai e ao menos uma claim filha autorizada.
- [ ] Fazer o filtro da sidebar e o guard das rotas consumirem a mesma fonte de claims; acesso por URL direta não pode contornar a navegação.
- [ ] Manter estado compartilhado apenas quando pertencer ao módulo; filtros e formulários específicos ficam no filho correspondente.
- [ ] Padronizar cabeçalho, breadcrumb, estados de loading/vazio/erro e comportamento responsivo sem criar uma página monolítica.
- [ ] Proibir Firebase, imports do `web`, chamadas HTTP diretas e decisões por role.

## Regras da API

- [ ] Definir ownership dos agregados e limites entre recursos antes de criar controllers; evitar um controller único para todo o menu.
- [ ] Aplicar autenticação global, claim do pai/filho e policy de escopo em todos os casos de uso.
- [ ] Compartilhar somente infraestrutura transversal: paginação, arquivos, jobs, auditoria, idempotência, correlação e tratamento de erros.
- [ ] Publicar contratos versionados e testáveis antes da integração das telas.
- [ ] Planejar migração de dados por agregado, com contagem, checksum/reconciliação, relatório de rejeitados e rollback.
- [ ] Medir disponibilidade, latência, erros, negações e filas por recurso/ação.

## Ordem de execução do módulo

1. Fechar claims, escopo e dados mestres compartilhados.
2. Migrar filhos de leitura/hub para validar navegação e autorização.
3. Migrar CRUDs e workflows, começando pelos que desbloqueiam outros filhos.
4. Migrar arquivos, integrações, cálculos, IA e exports como jobs protegidos.
5. Homologar todos os filhos, reconciliar dados e retirar o menu legado por feature flag.

## Critério de conclusão do módulo

- [ ] Todos os 25 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
