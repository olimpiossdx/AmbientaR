# Plano do módulo — Documentos Ambientais

Status: análise inicial  
Diretório: `documentos-ambientais`  
Dependência de acesso do pai: `modulo.documentos-ambientais=acessar`  
Filhos mapeados: **13**

## Objetivo

Migrar o menu **Documentos Ambientais** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-DOC-001 — CAR](fun-doc-001-car.md) | /app/car | CRUD /car-records; anexos/geometria |
| [FUN-DOC-002 — Condicionantes](fun-doc-002-condicionantes.md) | /app/compliance | CRUD /conditions; ação fulfill |
| [FUN-DOC-003 — CTF/IBAMA](fun-doc-003-ctf-ibama.md) | /app/ctf-ibama | CRUD /ctf-ibama-records |
| [FUN-DOC-004 — DAIA](fun-doc-004-daia.md) | /app/intervencoes | CRUD /environmental-interventions |
| [FUN-DOC-005 — Fauna documental](fun-doc-005-fauna-documental.md) | /app/fauna | CRUD /fauna-documents |
| [FUN-DOC-006 — Licenças](fun-doc-006-licencas.md) | /app/licenses, /new, /$id/edit | CRUD /licenses; ações de status |
| [FUN-DOC-007 — TAC](fun-doc-007-tac.md) | /app/tacs, /new, /$id/edit | CRUD /tacs; compromissos |
| [FUN-DOC-008 — MTR Declaração](fun-doc-008-mtr-declaracao.md) | /app/mtr-declaracao | CRUD /mtr-declarations; POST /sync-jobs |
| [FUN-DOC-009 — Pasta do cliente](fun-doc-009-pasta-do-cliente.md) | /app/documentos-ambientais/pasta-cliente | GET /client-folders/{clientId}, API-FILE |
| [FUN-DOC-010 — Monitoramento manual](fun-doc-010-monitoramento-manual.md) | /app/monitoring/manual | CRUD /water-monitoring/manual-readings; export |
| [FUN-DOC-011 — Telemetria](fun-doc-011-telemetria.md) | /app/monitoring/telemetric | GET /water-monitoring/telemetry; ingestão protegida separada |
| [FUN-DOC-012 — Outorgas](fun-doc-012-outorgas.md) | /app/outorgas, /new, /$id/edit | CRUD /water-grants |
| [FUN-DOC-013 — Usos Insignificantes](fun-doc-013-usos-insignificantes.md) | /app/usos-insignificantes | CRUD /insignificant-water-uses |

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

- [ ] Todos os 13 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
