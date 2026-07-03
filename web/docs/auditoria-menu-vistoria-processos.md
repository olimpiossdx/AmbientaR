# Auditoria — Vistoria Técnica + Licenciamento

## Vistoria Técnica

| Rota | Label |
|------|-------|
| `/inspections` | Consultar vistorias |
| `/inspections/new` | Nova vistoria |
| `/inspections/reports` | Relatórios de Campo |

PDF: jsPDF dinâmico em listagem e relatórios (commits anteriores).

## Licenciamento

| Rota | Label | Nota |
|------|-------|------|
| `/requests` | Consultar trâmites | Menu «Licenciamento» usa `requests`, não `/projects` |
| `/requests/new` | Nova solicitação | |
| `/requests/[id]/edit` | Edição | dinâmica, coberta pelo prefixo |

**Exportação:** PDF com identidade visual (`licenciamento-tramite-pdf.ts`) e rascunho de e-mail (`mailto:` via `licenciamento-tramite-report.ts`) na lista e no diálogo de detalhes.

`/projects` pertence ao menu **Cadastro** (Empreendimentos).

## Backlog

- Rotas dinâmicas `/proposals/[id]/edit` órfãs no relatório global — cobertas por uso direto, não por item de menu (orçamentos têm listagem no menu).
