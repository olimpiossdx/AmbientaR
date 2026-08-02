# Plano do módulo — Vendas & CRM

Status: análise inicial  
Diretório: `vendas-crm`  
Dependência de acesso do pai: `modulo.crm=acessar`  
Filhos mapeados: **9**

## Objetivo

Migrar o menu **Vendas & CRM** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-CRM-001 — Alertas e notificações](fun-crm-001-alertas-e-notificacoes.md) | /app/crm/alerts | CRUD /crm/alerts; ações read/dismiss |
| [FUN-CRM-002 — Configurações CRM](fun-crm-002-configuracoes-crm.md) | /app/crm/settings | GET/PATCH /crm/settings |
| [FUN-CRM-003 — Equipe e desempenho](fun-crm-003-equipe-e-desempenho.md) | /app/crm/team | GET /crm/team-performance; metas CRUD |
| [FUN-CRM-004 — Gestão de clientes](fun-crm-004-gestao-de-clientes.md) | /app/crm/clients | CRUD /crm/clients |
| [FUN-CRM-005 — Mídias sociais](fun-crm-005-midias-sociais.md) | /app/social-media | CRUD /social-media/posts; ações schedule/publish |
| [FUN-CRM-006 — Oportunidades e pipeline](fun-crm-006-oportunidades-e-pipeline.md) | /app/crm/opportunities, /new, /$id/edit | CRUD /crm/opportunities; ação move-stage |
| [FUN-CRM-007 — Painel de vendas](fun-crm-007-painel-de-vendas.md) | /app/crm | GET /crm/dashboard |
| [FUN-CRM-008 — Relatórios e análises](fun-crm-008-relatorios-e-analises.md) | /app/crm/reports | GET /crm/reports/* |
| [FUN-CRM-009 — Vendas e propostas](fun-crm-009-vendas-e-propostas.md) | /app/crm/proposals | Contrato ainda não identificado |

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
