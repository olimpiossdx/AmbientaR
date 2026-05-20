# Auditoria — Vistoria em Campo + Processos

## Vistoria em Campo

| Rota | Label |
|------|-------|
| `/inspections` | Consultar vistorias |
| `/inspections/new` | Nova vistoria |
| `/inspections/reports` | Relatórios de Campo |

PDF: jsPDF dinâmico em listagem e relatórios (commits anteriores).

## Processos

| Rota | Label | Nota |
|------|-------|------|
| `/requests` | Lista de processos | Menu “Processos” usa `requests`, não `/projects` |
| `/requests/new` | Novo processo | |
| `/requests/[id]/edit` | Edição | dinâmica, coberta pelo prefixo |

`/projects` pertence ao menu **Cadastro** (Empreendimentos).

## Backlog

- Rotas dinâmicas `/proposals/[id]/edit` órfãs no relatório global — cobertas por uso direto, não por item de menu (orçamentos têm listagem no menu).
