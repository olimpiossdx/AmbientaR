# Auditoria: respostas de save em formulários

Checklist de revisão do fluxo sucesso/erro (Firestore direto + APIs).  
Legenda de padrão de catch: **A** = toast-only; **B** = emit sempre; **C** = toast + emit sempre; **D** = helper (`handleFirestoreFormError`).

| Formulário / ficheiro | Persistência | Padrão | stripUndefined | Estado |
|----------------------|--------------|--------|----------------|--------|
| clients/client-form.tsx | Firestore | D | sim | migrado |
| empreendedores/empreendedor-form.tsx | Firestore | D | sim | migrado |
| projects/project-form.tsx | Firestore | D | sim | migrado |
| suppliers/supplier-form.tsx | Firestore | D | sim | migrado |
| settings/company-form.tsx | Firestore | D | sim | migrado |
| users/user-form.tsx | Firestore + Auth API | D | sim | migrado |
| licenses/license-form.tsx | Firestore | D | sim | migrado |
| contracts/contract-form.tsx | Firestore | A | sim | OK (referência) |
| commercial-proposals/proposal-form.tsx | Firestore | D | sim | migrado |
| proposals/proposal-form.tsx | Firestore | D | sim | migrado |
| compliance/compliance-form.tsx | Firestore | D | sim | migrado |
| ctf-ibama/ctf-ibama-form.tsx | Firestore | D | sim | migrado |
| services/service-form.tsx | Firestore | D | sim | migrado |
| invoices/invoice-form.tsx | Firestore | D | sim | migrado |
| crm/opportunity-form.tsx | Firestore | D | sim | migrado |
| oficios/oficio-form.tsx | Firestore | D | sim | migrado |
| intervencoes/intervencao-form.tsx | Firestore | D | sim | migrado |
| responsible-company/company-form.tsx | Firestore | D | sim | migrado |
| technical-responsible/responsible-form.tsx | Firestore | D | sim | migrado |
| cash-flow/transaction-form.tsx | Firestore | D | sim | migrado |
| usos-insignificantes/uso-insignificante-form.tsx | Firestore | D | sim | migrado |
| calendar/appointment-form.tsx | Firestore | D | sim | migrado |
| monitoring/manual/monitoring-form.tsx | Firestore | D | sim | migrado |
| fauna/fauna-upload-form.tsx | Firestore + Storage | D | sim | migrado |
| studies/pia/pia-form.tsx | Firestore | D | sim | migrado |
| studies/prada/prada-form.tsx | Firestore | D | sim | migrado |
| studies/ptrf/ptrf-form.tsx | Firestore | D | sim | migrado |
| studies/eia-rima/eia-rima-form.tsx | Firestore | D | sim | migrado |
| studies/outorgas/outorga-form.tsx | Firestore | D | sim | migrado |
| outorgas/outorga-form.tsx | Firestore | D | sim | migrado |
| studies/inventario/inventario-form.tsx | Firestore | D | sim | migrado |
| studies/barragem/barragem-form.tsx | Firestore | D | sim | migrado |
| studies/cavidades/cavidades-form.tsx | Firestore | D | sim | migrado |
| studies/analise-socioambiental/analise-socioambiental-form.tsx | Firestore | D | sim | migrado |
| studies/educacao-ambiental/dispensa-form.tsx | Firestore | D | sim | migrado |
| studies/educacao-ambiental/pea-form.tsx | Firestore | D | sim | migrado |
| studies/intervencao-ambiental/pia-form.tsx | Firestore | D | sim | migrado |
| studies/relatorios-diversos/carvao-vegetal/charcoal-form.tsx | Firestore | D | sim | migrado |
| studies/relatorios-diversos/transporte-residuos/form.tsx | Firestore | D | sim | migrado |
| studies/rca/rca-form-legacy.tsx | Firestore | D | sim | migrado |
| studies/pca/pca-form-legacy.tsx | Firestore | D | sim | migrado |
| studies/pca/listagem-*/pca-form-listagem-*.tsx (8) | Firestore | D | sim | migrado |
| studies/rca/listagem-*/rca-form-listagem-*.tsx (8) | Firestore | D | sim | migrado |
| financial/bens-patrimonio/patrimonio-form.tsx | Firestore | D | sim | migrado |
| mtr-declaracao/mtr-declaracao-upload-form.tsx | Firestore + API | D | sim | migrado |
| components/dynamic-study-form.tsx | Firestore | D | sim | migrado |
| studies/fauna/_shared/use-fauna-study-page-save.ts | Firestore | D | sim | migrado |
| licenses/compliance *-SERVIDOR.tsx | Firestore | D | sim | legado |
| Páginas de listagem (clients/page, etc.) | useCollection | hook | — | erro local |

## Teste manual por formulário

1. Criar registo mínimo → toast + redirect + doc no Firestore.
2. Editar → update OK.
3. Erro simulado → toast PT-BR, **sem** boundary JSON.
4. Perfil não-admin se aplicável.

## Infraestrutura

- `src/lib/firestore-form-errors.ts` — `handleFirestoreFormError`, `emitFirestoreErrorIfPermissionDenied`
- `src/lib/api-response.ts` — parser unificado de APIs
- `FirebaseErrorListener` — toast + log, sem `throw`
- `use-collection` / `use-doc` — erro no estado do hook, sem emit global

## QA (automático)

- `npm run typecheck` — OK
- `npm run apphosting:check` — ver log `apphosting-check.log`
