# Plano do módulo — Estudos Técnicos

Status: análise inicial  
Diretório: `estudos-tecnicos`  
Dependência de acesso do pai: `modulo.estudos-tecnicos=acessar`  
Filhos mapeados: **49**

## Objetivo

Migrar o menu **Estudos Técnicos** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-EST-001 — Programa de Educação Ambiental](fun-est-001-programa-de-educacao-ambiental.md) | /app/studies/educacao-ambiental, /novo, /$id/edit, /solicitar-dispensa, /dispensas/$id | CRUD /studies/environmental-education; /waivers; exports |
| [FUN-EST-002 — Programa de Ação Emergencial](fun-est-002-programa-de-acao-emergencial.md) | /app/studies/acao-emergencial | CRUD /studies/emergency-action-programs |
| [FUN-EST-003 — EIA/RIMA](fun-est-003-eia-rima.md) | /app/studies/eia-rima, /new, /$id/edit | CRUD /studies/eia-rima; exports |
| [FUN-EST-004 — Estudo de Cavidades](fun-est-004-estudo-de-cavidades.md) | /app/studies/cavidades, /new, /$id/edit | CRUD /studies/caves; analysis/exports |
| [FUN-EST-005 — Estudos de Fauna / Hub](fun-est-005-estudos-de-fauna-hub.md) | /app/studies/fauna | GET /fauna-studies/dashboard |
| [FUN-EST-006 — Fauna / Inventário](fun-est-006-fauna-inventario.md) | /app/studies/fauna/inventario, /$id | CRUD /fauna-studies/inventories |
| [FUN-EST-007 — Fauna / Relatório de Inventário](fun-est-007-fauna-relatorio-de-inventario.md) | /app/studies/fauna/inventario-relatorio, /$id | POST /fauna-studies/inventories/{id}/report-jobs |
| [FUN-EST-008 — Fauna / Monitoramento](fun-est-008-fauna-monitoramento.md) | /app/studies/fauna/monitoramento, /$id | CRUD /fauna-studies/monitoring |
| [FUN-EST-009 — Fauna / Relatório de Monitoramento](fun-est-009-fauna-relatorio-de-monitoramento.md) | /app/studies/fauna/monitoramento-relatorio, /$id | Contrato ainda não identificado |
| [FUN-EST-010 — Fauna / Resgate](fun-est-010-fauna-resgate.md) | /app/studies/fauna/resgate, /$id | CRUD /fauna-studies/rescues |
| [FUN-EST-011 — Fauna / Relatório de Resgate](fun-est-011-fauna-relatorio-de-resgate.md) | /app/studies/fauna/resgate-relatorio, /$id | Contrato ainda não identificado |
| [FUN-EST-012 — IDE-SisemaNet](fun-est-012-ide-sisemanet.md) | /app/studies/ide-sisemanet | GET /integrations/ide-sisema/catalog, analysis jobs |
| [FUN-EST-013 — Inventário Florestal / Lista](fun-est-013-inventario-florestal-lista.md) | /app/studies/inventario, /$id | CRUD /forest-inventories |
| [FUN-EST-014 — Inventário / Árvores](fun-est-014-inventario-arvores.md) | /app/studies/inventario/$id/arvores | CRUD /forest-inventories/{id}/trees |
| [FUN-EST-015 — Inventário / Parcelas](fun-est-015-inventario-parcelas.md) | /app/studies/inventario/$id/parcelas | CRUD /forest-inventories/{id}/plots |
| [FUN-EST-016 — Inventário / Espécies](fun-est-016-inventario-especies.md) | /app/studies/inventario/$id/especies | CRUD /forest-inventories/{id}/species |
| [FUN-EST-017 — Inventário / Fórmulas](fun-est-017-inventario-formulas.md) | /app/studies/inventario/$id/formulas | CRUD /forest-inventories/{id}/formulas |
| [FUN-EST-018 — Inventário / Calculadora e Resultado](fun-est-018-inventario-calculadora-e-resultado.md) | /app/studies/inventario/$id/calculadora, /resultado/$runId | POST /forest-inventories/{id}/calculation-jobs; resultado |
| [FUN-EST-019 — Coleta de Campo](fun-est-019-coleta-de-campo.md) | /app/coleta-campo, /nova, /$id, /$id/parcelas/$parcelaId | CRUD /field-collections; sub-recurso plots |
| [FUN-EST-020 — LAS-RAS](fun-est-020-las-ras.md) | /app/studies/las-ras, /new, /$id/edit | CRUD /studies/las-ras; exports |
| [FUN-EST-021 — Reanálise](fun-est-021-reanalise.md) | /app/studies/reanalise, /new, /$id/edit | CRUD /studies/reanalysis; exports |
| [FUN-EST-022 — Procuração](fun-est-022-procuracao.md) | /app/studies/procuracao, /new, /$id/edit | CRUD /powers-of-attorney; exports |
| [FUN-EST-023 — Mapas](fun-est-023-mapas.md) | /app/studies/mapas | CRUD /study-maps; render jobs |
| [FUN-EST-024 — Memorial Descritivo](fun-est-024-memorial-descritivo.md) | /app/studies/memorial-descritivo | CRUD /descriptive-memorials; calculation/export jobs |
| [FUN-EST-025 — Outorgas / Processos](fun-est-025-outorgas-processos.md) | /app/studies/outorgas, /processo/$id, /$id/edit | CRUD /water-grant-processes |
| [FUN-EST-026 — Outorgas / Nova](fun-est-026-outorgas-nova.md) | /app/studies/outorgas/new | POST /water-grant-processes |
| [FUN-EST-027 — PCA / Lista](fun-est-027-pca-lista.md) | /app/studies/pca, /$id/edit | CRUD /studies/pca |
| [FUN-EST-028 — PCA / Listagens A–H](fun-est-028-pca-listagens-a-h.md) | /app/studies/pca/new?listagem=A..H | POST /studies/pca; schemas GET /study-schemas/pca/{A..H} |
| [FUN-EST-029 — PIA](fun-est-029-pia.md) | /app/studies/pia, /new, /$id/edit | CRUD /studies/pia; inventory/export jobs |
| [FUN-EST-030 — PRADA](fun-est-030-prada.md) | /app/studies/prada, /new, /$id/edit | CRUD /studies/prada; exports |
| [FUN-EST-031 — Barragens / Visão geral](fun-est-031-barragens-visao-geral.md) | /app/studies/barragens | GET /dam-studies/dashboard |
| [FUN-EST-032 — Barragens / Projeto técnico](fun-est-032-barragens-projeto-tecnico.md) | /app/studies/barragem, /new, /$id/edit | CRUD /dam-projects; calculation/export jobs |
| [FUN-EST-033 — Barragens / Segurança e emergência](fun-est-033-barragens-seguranca-e-emergencia.md) | /app/studies/seguranca-barragens, /new, /$id/edit | CRUD /dam-safety-plans; HEC-RAS/export jobs |
| [FUN-EST-034 — Barragens / Piscinão](fun-est-034-barragens-piscinao.md) | /app/studies/piscinao-off-stream, /new, /$id/edit | CRUD /offstream-reservoir-projects; calculation/export jobs |
| [FUN-EST-035 — PTRF](fun-est-035-ptrf.md) | /app/studies/ptrf, /new, /$id/edit | CRUD /studies/ptrf; exports |
| [FUN-EST-036 — RCA / Lista](fun-est-036-rca-lista.md) | /app/studies/rca, /$id/edit | CRUD /studies/rca |
| [FUN-EST-037 — RCA / Listagens A–H](fun-est-037-rca-listagens-a-h.md) | /app/studies/rca/new?listagem=A..H | POST /studies/rca; schemas GET /study-schemas/rca/{A..H} |
| [FUN-EST-038 — Relatórios Diversos / Visão geral](fun-est-038-relatorios-diversos-visao-geral.md) | /app/studies/relatorios-diversos | GET /misc-reports/catalog |
| [FUN-EST-039 — Carvão vegetal](fun-est-039-carvao-vegetal.md) | /app/studies/relatorios-diversos/carvao-vegetal | CRUD /misc-reports/charcoal; exports |
| [FUN-EST-040 — PTRF/PRAD](fun-est-040-ptrf-prad.md) | /app/studies/relatorios-diversos/ptrf-prad | CRUD /misc-reports/ptrf-prad; exports |
| [FUN-EST-041 — Transporte de resíduos](fun-est-041-transporte-de-residuos.md) | /app/studies/relatorios-diversos/transporte-residuos | CRUD /misc-reports/waste-transport; exports |
| [FUN-EST-042 — MTR-MG](fun-est-042-mtr-mg.md) | /app/studies/mtr | CRUD /mtr-studies; sync/export jobs |
| [FUN-EST-043 — Compensação / Visão geral](fun-est-043-compensacao-visao-geral.md) | /app/studies/compensacao-ambiental | GET /environmental-compensations/dashboard |
| [FUN-EST-044 — Compensação / Espécies](fun-est-044-compensacao-especies.md) | /app/studies/compensacao-ambiental/especies | CRUD /environmental-compensations/protected-species |
| [FUN-EST-045 — Compensação / SNUC](fun-est-045-compensacao-snuc.md) | /app/studies/compensacao-ambiental/snuc | CRUD /environmental-compensations/snuc |
| [FUN-EST-046 — Compensação / Mata Atlântica](fun-est-046-compensacao-mata-atlantica.md) | /app/studies/compensacao-ambiental/mata-atlantica | CRUD /environmental-compensations/atlantic-forest |
| [FUN-EST-047 — Compensação / Minerária](fun-est-047-compensacao-mineraria.md) | /app/studies/compensacao-ambiental/mineraria | CRUD /environmental-compensations/mining |
| [FUN-EST-048 — Compensação / APP](fun-est-048-compensacao-app.md) | /app/studies/compensacao-ambiental/app | CRUD /environmental-compensations/app |
| [FUN-EST-049 — Reserva Legal](fun-est-049-reserva-legal.md) | /app/studies/reserva-legal | CRUD /legal-reserves; analysis/export jobs |

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

- [ ] Todos os 49 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
