# Plano do módulo — Georreferenciamento

Status: análise inicial  
Diretório: `georreferenciamento`  
Dependência de acesso do pai: `modulo.georreferenciamento=acessar`  
Filhos mapeados: **12**

## Objetivo

Migrar o menu **Georreferenciamento** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-GEO-001 — Painel](fun-geo-001-painel.md) | /app/georeferenciamento | GET /georeferencing/dashboard |
| [FUN-GEO-002 — Trâmites fundiários](fun-geo-002-tramites-fundiarios.md) | /app/georeferenciamento/processos, /$id | CRUD /georeferencing/processes; ações |
| [FUN-GEO-003 — Rural SIGEF/INCRA](fun-geo-003-rural-sigef-incra.md) | /app/georeferenciamento/rural | CRUD /georeferencing/rural-projects; validation jobs |
| [FUN-GEO-004 — Urbano cartório](fun-geo-004-urbano-cartorio.md) | /app/georeferenciamento/urbano | CRUD /georeferencing/urban-projects |
| [FUN-GEO-005 — CAR/SICAR](fun-geo-005-car-sicar.md) | /app/georeferenciamento/ambiental | CRUD /georeferencing/car-projects; integration jobs |
| [FUN-GEO-006 — Histórico CAR](fun-geo-006-historico-car.md) | /app/georeferenciamento/historico-car | GET /car-history; snapshot jobs |
| [FUN-GEO-007 — Campo e levantamento](fun-geo-007-campo-e-levantamento.md) | /app/georeferenciamento/campo | CRUD /georeferencing/surveys |
| [FUN-GEO-008 — Documentação técnica](fun-geo-008-documentacao-tecnica.md) | /app/georeferenciamento/documentos | CRUD /georeferencing/documents; API-FILE |
| [FUN-GEO-009 — Memorial descritivo](fun-geo-009-memorial-descritivo.md) | /app/georeferenciamento/memorial-descritivo | Contrato ainda não identificado |
| [FUN-GEO-010 — Validações](fun-geo-010-validacoes.md) | /app/georeferenciamento/validacoes | POST /georeferencing/validation-jobs |
| [FUN-GEO-011 — Cartório e registro](fun-geo-011-cartorio-e-registro.md) | /app/georeferenciamento/registro | CRUD /georeferencing/registrations; ações |
| [FUN-GEO-012 — Referências normativas](fun-geo-012-referencias-normativas.md) | /app/georeferenciamento/referencias | CRUD /georeferencing/references |

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

- [ ] Todos os 12 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
