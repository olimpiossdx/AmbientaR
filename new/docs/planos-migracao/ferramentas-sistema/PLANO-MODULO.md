# Plano do módulo — Ferramentas do Sistema

Status: análise inicial  
Diretório: `ferramentas-sistema`  
Dependência de acesso do pai: `modulo.ferramentas-sistema=acessar`  
Filhos mapeados: **19**

## Objetivo

Migrar o menu **Ferramentas do Sistema** como módulo coeso do `new`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no `ambientaR-api`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
| [FUN-SIS-001 — Informações da empresa](fun-sis-001-informacoes-da-empresa.md) | /app/settings/company | GET/PATCH /organization/settings |
| [FUN-SIS-002 — Responsáveis técnicos](fun-sis-002-responsaveis-tecnicos.md) | /app/technical-responsible, /new, /$id/edit | CRUD /technical-responsibles |
| [FUN-SIS-003 — Identidade visual](fun-sis-003-identidade-visual.md) | /app/settings#identidade-visual | GET/PATCH /organization/branding, API-FILE |
| [FUN-SIS-004 — Aparência](fun-sis-004-aparencia.md) | /app/settings/appearance | GET/PATCH /users/me/preferences |
| [FUN-SIS-005 — Templates](fun-sis-005-templates.md) | /app/settings/templates, /rca | CRUD /document-templates; API-FILE |
| [FUN-SIS-006 — Laudos](fun-sis-006-laudos.md) | /app/laudos, /new, /$id | CRUD /technical-reports; report jobs |
| [FUN-SIS-007 — Consultas técnicas](fun-sis-007-consultas-tecnicas.md) | /app/consultas, /new, /$id, /$id/edit | CRUD /technical-consultations; ações |
| [FUN-SIS-008 — MCP + RAG](fun-sis-008-mcp-rag.md) | /app/configuracoes/mcp-rag | GET/PATCH /ai-platform/settings; sync jobs |
| [FUN-SIS-009 — Fontes de conhecimento](fun-sis-009-fontes-de-conhecimento.md) | /app/knowledge-sources, /new, /$id | CRUD /knowledge-sources; indexing jobs |
| [FUN-SIS-010 — Biblioteca IA OneDrive](fun-sis-010-biblioteca-ia-onedrive.md) | /app/ai-lab/cloud-library | GET /cloud-library; sync jobs |
| [FUN-SIS-011 — Integração OneDrive](fun-sis-011-integracao-onedrive.md) | /app/settings/onedrive-integration | OAuth begin/callback/status/disconnect no API |
| [FUN-SIS-012 — Ferramentas MCP](fun-sis-012-ferramentas-mcp.md) | /app/ai-lab/mcp | CRUD /mcp-tools; test action |
| [FUN-SIS-013 — Laboratório RAG](fun-sis-013-laboratorio-rag.md) | /app/ai-lab/rag | Contrato ainda não identificado |
| [FUN-SIS-014 — Importação de fonte local](fun-sis-014-importacao-de-fonte-local.md) | /app/settings/ai-local-source | POST /knowledge-import-jobs |
| [FUN-SIS-015 — Backup de excluídos](fun-sis-015-backup-de-excluidos.md) | /app/settings/deleted-backups | GET /deleted-records; ação restore |
| [FUN-SIS-016 — Explorador de arquivos](fun-sis-016-explorador-de-arquivos.md) | /app/settings/files | GET /files; API-FILE |
| [FUN-SIS-017 — Log de auditoria](fun-sis-017-log-de-auditoria.md) | /app/audit-log | GET /audit-events |
| [FUN-SIS-018 — Canais WhatsApp/Instagram](fun-sis-018-canais-whatsapp-instagram.md) | /app/canais | CRUD /communication-channels; OAuth/webhooks |
| [FUN-SIS-019 — App/Coleta de campo](fun-sis-019-app-coleta-de-campo.md) | /app/app-campo | GET /field-app/bootstrap; sync commands se offline aprovado |

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

- [ ] Todos os 19 planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
