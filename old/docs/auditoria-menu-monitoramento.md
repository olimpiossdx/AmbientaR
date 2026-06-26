# Auditoria — Menu Monitoramento de Outorga

Gerado em: 2026-05-20 (limpeza cirúrgica por menu, antes da varredura React).

## Escopo no menu (`navigation-config.ts`)

| Rota no menu | Ficheiro | Estado |
|--------------|----------|--------|
| `/monitoring/manual` | `src/app/(app)/monitoring/manual/page.tsx` | Ativo — lançamento manual, conformidade, export PDF |
| `/monitoring/telemetric` | `src/app/(app)/monitoring/telemetric/page.tsx` | Ativo — telemetria, export PDF conformidade, CSV MIRA |

Submenu: **Monitoramento de Outorga** (papéis: admin, client, cliente_autonomo, representative, gestor, supervisor, technical, advogado).

## Rotas fora do menu (órfãs)

| Rota | Ficheiro | Recomendação |
|------|----------|--------------|
| `/monitoring` | `src/app/(app)/monitoring/page.tsx` | Era placeholder “em construção”. **Corrigido:** redireciona para `/monitoring/manual` para evitar página morta se alguém aceder à URL raiz. |

## Typecheck / build

- `npm run typecheck`: OK (após lote jsPDF dinâmico em `export-water-report` e páginas manual/telemetric).
- Rotas do menu cobertas em `docs/menu-route-audit.md` (secção “código ativo”).

## PDF e bundle

- Exportação de conformidade hídrica: `generateWaterCompliancePDF` em `src/lib/export-water-report.ts` — **import dinâmico** de `jspdf` + `jspdf-autotable` (commit `aeddc26`).
- Handlers `handleExportCompliancePdf` em manual e telemetric: `async` + `await`.

## Funcionalidades pendentes (não remover — backlog)

Em `telemetric/page.tsx`, handlers com `TODO` (botões podem existir na UI sem implementação completa):

1. Relatório de vazão captada (PDF/XLSX)
2. Relatório de vazão a jusante (PDF/XLSX)
3. Relatório consolidado por período (`dateFrom`–`dateTo`, PDF e XLSX)

**Decisão:** manter TODOs; não apagar botões sem validar com utilizador.

## Código morto / duplicação

- Não há pasta experimental tipo `controle-projetos` neste menu.
- `monitoring-form.tsx` é usado apenas por `manual/page.tsx` — manter.
- Filtro `monitoringType`: manual usa `!monitoringType \|\| === 'manual'`; telemetric usa `=== 'telemetric'` — coerente com modelo de dados.

## Relação com outros menus

- Cadastro de outorgas: `/outorgas` (menu separado).
- Estudos `/studies/outorgas` — fluxo de estudos, não substitui monitoramento operacional.

## Próximos passos sugeridos (outro menu, não React ainda)

1. **Financeiro — legado `/proposals`:** rota órfã; coleção Firestore `proposals` vs `commercialProposals` em `/commercial-proposals`. Não redirecionar sem migração de dados.
2. **`upload-pipeline.ts`:** único `import { jsPDF }` estático restante em `src/` (compressão/upload, não exportação por menu).

## Varredura React (deixada para o final)

- Revisar dependências de `useMemo` / `useCallback` em `manual/page.tsx` e `telemetric/page.tsx` (ficheiros grandes).
- Não alterar nesta fase.
