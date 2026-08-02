# Plano do módulo — IA / Fiscal Ambiental Digital

Status: análise inicial  
Diretório: `ia-fiscal-ambiental-digital`  
Dependência de acesso do pai: `modulo.ia=acessar + modulo.fiscal-ambiental=acessar`  
Filhos mapeados: **14**

## Objetivo

Migrar o menu **IA / Fiscal Ambiental Digital** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-FAD-001 — FAD / Início](fun-fad-001-fad-inicio.md) | /app/ia/fiscal-ambiental-digital/dashboard | GET /fad/dashboard |
| [FUN-FAD-002 — FAD / Montar acervo](fun-fad-002-fad-montar-acervo.md) | /app/ia/fiscal-ambiental-digital/montar-acervo | POST /fad/collection-jobs |
| [FUN-FAD-003 — FAD / Biblioteca](fun-fad-003-fad-biblioteca.md) | /app/ia/fiscal-ambiental-digital/biblioteca | GET /fad/assets, API-FILE |
| [FUN-FAD-004 — FAD / Linha do tempo](fun-fad-004-fad-linha-do-tempo.md) | /app/ia/fiscal-ambiental-digital/linha-do-tempo | CRUD /fad/timeline-events |
| [FUN-FAD-005 — FAD / Comparar](fun-fad-005-fad-comparar.md) | /app/ia/fiscal-ambiental-digital/comparador | POST /fad/comparison-jobs |
| [FUN-FAD-006 — FAD / Evidências](fun-fad-006-fad-evidencias.md) | /app/ia/fiscal-ambiental-digital/evidencias | CRUD /fad/evidence |
| [FUN-FAD-007 — FAD / Inteligência](fun-fad-007-fad-inteligencia.md) | /app/ia/fiscal-ambiental-digital/inteligencia | POST /fad/intelligence-jobs |
| [FUN-FAD-008 — FAD / Fiscalização](fun-fad-008-fad-fiscalizacao.md) | /app/ia/fiscal-ambiental-digital/fiscalizacao | POST /fad/inspection-check-jobs |
| [FUN-FAD-009 — FAD / Relatórios](fun-fad-009-fad-relatorios.md) | /app/ia/fiscal-ambiental-digital/relatorios | POST /fad/report-jobs, GET /fad/reports |
| [FUN-FAD-010 — FAD / Monitoramento](fun-fad-010-fad-monitoramento.md) | /app/ia/fiscal-ambiental-digital/monitoramento | CRUD /fad/monitoring-rules; POST /runs |
| [FUN-FAD-011 — FAD / Auditoria ESG](fun-fad-011-fad-auditoria-esg.md) | /app/ia/fiscal-ambiental-digital/esg | GET /fad/esg, POST /fad/esg/snapshots |
| [FUN-FAD-012 — FAD / Configurações](fun-fad-012-fad-configuracoes.md) | /app/ia/fiscal-ambiental-digital/configuracoes | GET/PATCH /fad/settings |
| [FUN-FAD-013 — FAD / Novo workspace](fun-fad-013-fad-novo-workspace.md) | /app/ia/fiscal-ambiental-digital/workspace/novo | POST /fad/workspaces |
| [FUN-FAD-014 — FAD / Workspace](fun-fad-014-fad-workspace.md) | /app/ia/fiscal-ambiental-digital/workspace/$workspaceId | CRUD /fad/workspaces |

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

- [ ] Todos os 14 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
