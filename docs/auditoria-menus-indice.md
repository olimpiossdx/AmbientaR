# Índice — Auditoria de menus (pré-varredura React)

Atualizado em: 2026-05-20

Objetivo: percorrer **todos** os menus de `navigation-config.ts`, documentar rotas, órfãs, correções seguras e backlog — **antes** da varredura React.

Legenda: ✅ auditado | 🔧 corrigido nesta fase | ⏳ backlog

| # | Menu | Doc | Estado |
|---|------|-----|--------|
| 1 | Painel | — | ✅ |
| 2 | Financeiro | [auditoria-menu-financeiro.md](./auditoria-menu-financeiro.md) | ✅ 🔧 Orçamentos no menu |
| 3 | Cadastro | [auditoria-menu-cadastro.md](./auditoria-menu-cadastro.md) | ✅ 🔧 redirect `environmental-company` |
| 4 | Documentos Ambientais | [auditoria-menu-autorizacoes.md](./auditoria-menu-autorizacoes.md) | ✅ (Monitoramento: doc dedicado) |
| 5 | Autos de Infração - Defesa | [auditoria-menu-autorizacoes.md](./auditoria-menu-autorizacoes.md) | ✅ |
| 6 | Vistoria Técnica | [auditoria-menu-vistoria-processos.md](./auditoria-menu-vistoria-processos.md) | ✅ |
| 7 | Licenciamento | [auditoria-menu-vistoria-processos.md](./auditoria-menu-vistoria-processos.md) | ✅ |
| 8 | IA | [auditoria-menu-ia-estudos.md](./auditoria-menu-ia-estudos.md) | ✅ |
| 9 | Estudos Técnicos | [auditoria-menu-ia-estudos.md](./auditoria-menu-ia-estudos.md) | ✅ 🔧 redirect `/studies`, PIA index |
| 10 | Georeferenciamento | [auditoria-menu-georef-crm.md](./auditoria-menu-georef-crm.md) | ✅ |
| 11 | Vendas & CRM | [auditoria-menu-georef-crm.md](./auditoria-menu-georef-crm.md) | ✅ |
| 12 | Webmail | [auditoria-menu-config-acessos.md](./auditoria-menu-config-acessos.md) | ✅ |
| 13 | Ofícios e Comunicações | [auditoria-menu-config-acessos.md](./auditoria-menu-config-acessos.md) | ✅ |
| 14 | Acessos Governamentais | [auditoria-menu-config-acessos.md](./auditoria-menu-config-acessos.md) | ✅ |
| 15 | Configurações | [auditoria-menu-config-acessos.md](./auditoria-menu-config-acessos.md) | ✅ 🔧 módulos operacionais no menu |
| 16 | Agenda | [auditoria-menu-config-acessos.md](./auditoria-menu-config-acessos.md) | ✅ |

Relatório automático de rotas: [menu-route-audit.md](./menu-route-audit.md) (script com normalização de `?` e `#`).

Monitoramento (submenu): [auditoria-menu-monitoramento.md](./auditoria-menu-monitoramento.md).

## Correções transversais aplicadas

| Rota | Ação |
|------|------|
| `/monitoring` | redirect → `/monitoring/manual` |
| `/studies` | redirect → `/studies/educacao-ambiental` |
| `/environmental-company` | redirect → `/responsible-company` |
| `/studies/intervencao-ambiental` | redirect → `/studies/pia` (corrige `router.push` após salvar PIA) |
| `/proposals` | reposto no menu Financeiro |
| `/webmail` | já redireciona para `/external?...` |
| Configurações | entradas para `/consultas`, `/laudos`, `/knowledge-sources`, `/inventarios`, `/canais`, `/app-campo` |

## Código morto / fase React (não apagar ainda)

- `environmental-company/company-form.tsx` — UI legada; rota raiz só redireciona.
- `proposals/` vs `commercial-proposals/` — **não** fundir (coleções distintas).
- `upload-pipeline.ts` — único `import` estático de jsPDF em `src/`.
- Páginas `*-SERVIDOR*` — ver `docs/AUDITORIA-CODIGO-MORTO-E-API.md`.

## Próximo passo

**Varredura React** (hooks, dependências, duplicação de componentes) após validação em dev dos redirects e novos itens de menu admin.
