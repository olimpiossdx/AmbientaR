# Auditoria — Configurações, Webmail, Ofícios, Acessos, Agenda

## Configurações

Subitens principais: automações IA, RAG, MCP, templates, utilizadores, empresa, aparência, audit-log, ficheiros, backups.

### Módulos operacionais repostos no menu (admin)

| Rota | Label | Notas |
|------|-------|-------|
| `/consultas` | Consultas Técnicas | Fluxo com laudos |
| `/laudos` | Laudos | API `gerar-docx`, canais WhatsApp |
| `/knowledge-sources` | Fontes Normativas | Ligado a termos de referência / RAG |
| `/canais` | Canais | Planejamento Fase 6 (`docs/CANAIS-FASE6.md`) |

**Coleta de campo** (`/coleta-campo`): submenu de **Estudos Técnicos → Inventário Florestal**. Rotas legadas `/inventarios` e `/app-campo` redirecionam (5B). Ver `docs/COLETA-CAMPO-ESTRATEGIA.md`.

`/settings` — hub “Identidade visual” (hash `#identidade-visual` no menu); página ativa, coberta após normalização do audit.

## Webmail

- Menu: link `/external?...` (webmail hospedado).
- `/webmail` — redirect para o mesmo external (rota legada).

## Ofícios

| Rota | `/oficios` (+ new, edit) |

## Acessos Governamentais

Apenas links `/external?url=...` (SEMAD, IBAMA, SEI, etc.) — sem páginas locais além de `external/page.tsx`.

## Agenda

| Rota | `/calendar` — item topo, fora de Configurações |

## Painel (`/`)

Router por role: admin, financial, client, CRM, fauna, etc. Sem placeholder.
