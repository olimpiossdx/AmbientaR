# Varredura React (pós-auditoria de menus)

Gerado em: 2026-05-20

## Ferramentas

| Comando | Resultado |
|---------|-----------|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `react-hooks/exhaustive-deps` | Ativado como `warn` em `.eslintrc.json` (sem avisos novos no lint atual) |

## Alterações

### Bundle / imports pesados

- `src/lib/upload-pipeline.ts` — `jsPDF` passa a `await import("jspdf")` dentro de `compressPdfFile` (último import estático de jsPDF em `src/`).

### Código morto

- Removido `src/app/(app)/environmental-company/company-form.tsx` (rota raiz só redireciona para `/responsible-company`).
- Atualizado inventário em `settings/files/page.tsx`.

### Ruído em desenvolvimento

Removidos `useEffect` duplicados que só faziam `console.log` em páginas que já usam `useFinancialMenuDebug()` / `useCadastroMenuDebug()`:

- `cash-flow/page.tsx`
- `financial/dre-contabil/page.tsx`
- `financial/abc-curve/page.tsx`
- `empreendedores/page.tsx`
- `projects/page.tsx`
- `responsible-company/page.tsx`

### Formulários (debug residual)

- Removido `console.log` de submit em `dispensa-form.tsx`, `studies/las-ras/las-ras-form.tsx`, `las-ras/las-ras-form.tsx`.

## Hooks já saneados (sessões anteriores)

- `use-local-branding.ts` — dependências `[isLoading, data]`.
- Supressões pontuais documentadas: `firebase/provider.tsx`, `aia-workflow-panel.tsx`.

## Backlog React (opcional)

- Páginas muito grandes (`contracts/page.tsx`, `commercial-proposals/page.tsx`, `users/page.tsx`) — refatorar em subcomponentes quando houver tempo.
- Ficheiros `*-SERVIDOR*` — excluídos do `tsc`; remoção só com PR dedicado.
- `console.warn` em fluxos de erro (Auth, upload) — manter; são diagnóstico útil.

## Ordem de trabalho concluída

1. Auditoria de todos os menus ✅  
2. Varredura React ✅  
3. `git push` — a seguir
