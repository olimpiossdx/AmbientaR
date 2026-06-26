# Auditoria Financeiro — por etapas

Atualizado: 2026-05-21

## Mapa do menu (20 entradas)

| # | Rota | Label | Status auditoria |
|---|------|-------|------------------|
| 1 | `/bank-access` | Acesso Bancário | OK (placeholder) |
| 2 | `/clients` | Clientes | **Corrigido** — `isLoading` do hook |
| 3 | `/contracts` | Contratos | **Corrigido** — optional chaining |
| 4 | `/contracts-suppliers` | Contratos-Fornecedores | OK |
| 5 | `/financial/abc-curve` | Curva ABC | OK |
| 6 | `/financial/bens-patrimonio` | Bens e Patrimônio | OK |
| 7 | `/financial/dre-contabil` | DRE Contábil | OK |
| 8 | `/invoices` | Faturas | **Corrigido** — loading `clientIdsForUser` |
| 9 | `/suppliers` | Fornecedores | OK |
| 10 | `/cash-flow` | Lançamentos de Caixa | **Corrigido** (commit 91c47a1 — Select fornecedor) |
| 11 | `/external` | NFe-Eletrônica | OK (Suspense) |
| 12 | `/commercial-proposals` | Orçamentos e Propostas | **Corrigido** — loading `clientIdsForUser` |
| 13 | `/financial/painel` | Painel Financeiro | OK |
| 14 | `/financial/fluxo-projetado` | Fluxo Projetado | OK |
| 15 | `/financial/conciliacao` | Conciliação Bancária | **Corrigido** — try/catch |
| 16 | `/financial/abc-servicos` | Curva ABC Serviços | OK |
| 17 | `/financial/abc-fornecedores` | Curva ABC Fornecedores | OK |
| 18 | `/financial/orcamento` | Orçamento Anual | **Corrigido** — race ao carregar |
| 19 | `/financial/export-contabil` | Exportação Contábil | OK |
| 20 | `/studies/assistant?tipo=financeiro` | Assistente IA | OK |
| 21 | `/services` | Tabela de Serviços | OK |

## Etapa 1 — Runtime / crash (concluída)

- `clients/page.tsx`: `isLoading` via `useCollection`, não `data === undefined`.
- `contracts/page.tsx`: `contratante`, `objeto`, `contratado`, `responsavelTecnico` com `?.`.

## Etapa 2 — Loading e persistência (concluída)

- `invoices/page.tsx`, `commercial-proposals/page.tsx`: skeleton enquanto `clientIdsForUser === null`.
- `financial/conciliacao/page.tsx`: erro tratado em `markReconciled`.
- `financial/orcamento/page.tsx`: `loadingDoc` + cancelamento no `useEffect`.

## Etapa 3 — Formulários, legado e tipos (concluída)

1. **`invoice-form.tsx`**: Select contrato opcional com `CONTRACT_NONE_SELECT_VALUE`; `objeto?.empreendimento`.
2. **`contract-form.tsx`**: já usava `isLoading` nos Selects; sem `SelectItem value=""`.
3. **`supplier-form.tsx`**, **`patrimonio-form.tsx`**: sem padrões inválidos encontrados.
4. **`/proposals`**: mantido **fora do menu** (unificado em Orçamentos e Propostas); URLs legadas redirecionam para `/commercial-proposals` com `Suspense`.
5. **`contracts/page.tsx`**: `contractsLoading` + `isResolvingClientIds`; `Contract.clientId` legado tipado; helpers `getAppUserProfileUid` / `isSelfRegisteredPortalUser`.
6. **`invoices/page.tsx`**: mesmos helpers (removido `(user as any)`).
7. **`proposals/proposal-form.tsx`**: marcado `@deprecated` (código legado).

### Teste manual recomendado (produção, papel `financial`)

| Submenu | O que validar |
|---------|----------------|
| Clientes | Lista carrega com skeleton |
| Contratos | Abrir detalhe/upload sem crash em contrato antigo |
| Faturas | Nova fatura → contrato opcional “Nenhum” |
| Lançamentos de Caixa | Despesa + fornecedor |
| Conciliação | Marcar conciliado com erro amigável se falhar |
| Orçamento Anual | Trocar ano antes de salvar |
| Demais itens financeiros | Abrir página sem erro no console |

## Validação

```bash
npm run typecheck
npm run apphosting:check   # antes de deploy
```
