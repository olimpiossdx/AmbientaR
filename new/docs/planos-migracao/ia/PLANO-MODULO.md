# Plano do módulo — IA

Status: análise inicial  
Diretório: `ia`  
Dependência de acesso do pai: `modulo.ia=acessar`  
Filhos mapeados: **9**

## Objetivo

Migrar o menu **IA** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-IA-001 — Águas / MIRA](fun-ia-001-aguas-mira.md) | /app/studies/assistant?type=mira | POST /ai/assistants/mira/runs |
| [FUN-IA-002 — Análise Geoespacial](fun-ia-002-analise-geoespacial.md) | /app/analise-ambiental | POST /geo-analysis-jobs |
| [FUN-IA-003 — Análise Socioambiental](fun-ia-003-analise-socioambiental.md) | /app/studies/analise-socioambiental | POST /socio-environmental-analysis-jobs |
| [FUN-IA-004 — Cruzamento de dados](fun-ia-004-cruzamento-de-dados.md) | /app/studies/assistant?type=mcp | POST /ai/assistants/data-crossing/runs |
| [FUN-IA-005 — Legislação e estudos](fun-ia-005-legislacao-e-estudos.md) | /app/studies/assistant?type=geral | POST /ai/assistants/legal/runs |
| [FUN-IA-006 — Relatórios de IA](fun-ia-006-relatorios-de-ia.md) | /app/reporting | GET /ai/reports, GET /{id} |
| [FUN-IA-007 — Síntese de texto](fun-ia-007-sintese-de-texto.md) | /app/studies/assistant?type=rag | POST /ai/assistants/summarization/runs |
| [FUN-IA-008 — Automações IA](fun-ia-008-automacoes-ia.md) | /app/ai-lab/automations | CRUD /ai-automations; ações run/enable/disable |
| [FUN-IA-009 — Hub IA](fun-ia-009-hub-ia.md) | /app/ai-lab | GET /ai/capabilities |

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

- [ ] Todos os 9 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
