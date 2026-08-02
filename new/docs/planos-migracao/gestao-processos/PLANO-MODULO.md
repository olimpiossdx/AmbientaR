# Plano do módulo — Gestão de Projetos e Processos

Status: análise inicial  
Diretório: `gestao-processos`  
Dependência de acesso do pai: `modulo.gestao-processos=acessar`  
Filhos mapeados: **6**

## Objetivo

Migrar o menu **Gestão de Projetos e Processos** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-PRO-001 — Processos / Projetos](fun-pro-001-processos-projetos.md) | /app/gestao-processos/projetos, /$id | CRUD /process-projects |
| [FUN-PRO-002 — Processos / Fluxo](fun-pro-002-processos-fluxo.md) | /app/gestao-processos/fluxo | CRUD /processes; ações de transição |
| [FUN-PRO-003 — Processos / Tarefas](fun-pro-003-processos-tarefas.md) | /app/gestao-processos/tarefas | CRUD /tasks; ações assign/complete/reopen |
| [FUN-PRO-004 — Processos / Indicadores / Resumo](fun-pro-004-processos-indicadores-resumo.md) | /app/gestao-processos/indicadores | GET /process-indicators/summary |
| [FUN-PRO-005 — Processos / Indicadores / Análise](fun-pro-005-processos-indicadores-analise.md) | /app/gestao-processos/indicadores/analise | GET /process-indicators/analysis |
| [FUN-PRO-006 — Processos / Planilha](fun-pro-006-processos-planilha.md) | /app/gestao-processos/planilha | POST /process-import-jobs |

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

- [ ] Todos os 6 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
