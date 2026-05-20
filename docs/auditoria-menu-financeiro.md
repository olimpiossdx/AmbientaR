# Auditoria — Menu Financeiro

Gerado em: 2026-05-20 (limpeza cirúrgica por menu, antes da varredura React).

## Escopo no menu (`navigation-config.ts`)

Submenu **Financeiro** (papéis no item pai: admin, financial, sales, client, representative).

| Rota | Label | Coleção / notas |
|------|-------|-----------------|
| `/bank-access` | Acesso Bancário | — |
| `/clients` | Clientes | `clients` |
| `/contracts` | Contratos | `contracts` + PDF dinâmico (`contract-pdf.ts`) |
| `/contracts-suppliers` | Contratos-Fornecedores | `supplierContracts` + PDF dinâmico |
| `/financial/abc-curve` | Curva ABC | — |
| `/financial/dre-contabil` | DRE Contábil | — |
| `/invoices` | Faturas | `invoices` |
| `/suppliers` | Fornecedores | `suppliers` |
| `/cash-flow` | Lançamentos de Caixa | `transactions` |
| NFe (external) | NFe-Eletrônica | link externo |
| `/proposals` | **Orçamentos** | `proposals` — reintroduzido no menu nesta auditoria |
| `/commercial-proposals` | Propostas Comerciais | `commercialProposals` |
| `/services` | Tabela de Serviços | `services` |

## Orçamentos vs Propostas Comerciais (não são duplicatas)

| | Orçamentos (`/proposals`) | Propostas Comerciais (`/commercial-proposals`) |
|--|---------------------------|------------------------------------------------|
| Firestore | `proposals` | `commercialProposals` |
| UI | Título “Orçamentos”, PDF `orcamento_*.pdf` | Título “Propostas Comerciais” |
| Criação na UI | `canManageProposalsAndCommercialQuotes` → admin, financial | Portal + vendas (regras na página) |
| CRM | — | `/crm/proposals` redireciona para módulo comercial |

**Problema encontrado:** `/proposals` estava **fora do menu** (órfã estática em `menu-route-audit.md`), embora o código e as regras Firestore estivessem ativos.

**Correção aplicada:** entrada **Orçamentos** no submenu Financeiro + rotas em `FINANCIAL_ROUTES` / `FINANCIAL_PATH_PREFIXES` + prefixo Storage `proposals/`.

**Não fazer:** redirecionar `/proposals` → `/commercial-proposals` (coleções e fluxos diferentes).

## Contratos e fornecedores

- Sem TODOs nos ficheiros principais.
- `persistContractPdfForSignature` usa `contractPdfBlob` (jsPDF já carregado sob demanda dentro de `buildContractPdfDoc`).
- Propostas comerciais podem gerar contrato PDF a partir da listagem (`generateContractPdf`).

## Rotas órfãs relacionadas (outros menus)

- `/monitoring` — corrigido na auditoria anterior (redirect → manual).
- `/settings`, `/environmental-company`, etc. — ver `docs/menu-route-audit.md`.

## Código removido anteriormente (não reintroduzir)

- `financial/controle-projetos/**` — módulo experimental retirado a pedido do utilizador.

## Duplicação de UI (backlog, não alterado)

- `proposals/page.tsx` e `commercial-proposals/page.tsx` partilham padrão de listagem/PDF semelhante (~900+ linhas cada). Refatoração comum só após validação de negócio; fora do âmbito desta auditoria.

## jsPDF

- Orçamentos: `handleExportPdf` já usa `await import("jspdf")` em `proposals/page.tsx`.
- Contratos / propostas comerciais / relatório hídrico: lote commit `aeddc26`.

## Pendências

1. **`upload-pipeline.ts`:** único import estático de jsPDF fora de tipos em `src/` (compressão de upload).
2. **Storage rules:** confirmar se `proposals/` no Storage segue as mesmas regras que `commercial-proposals/` (revisão manual na consola / `storage.rules` se existir deploy).
3. **Varredura React (fase final):** hooks em páginas grandes (`contracts/page.tsx`, `commercial-proposals/page.tsx`, `proposals/page.tsx`).

## Validação

Após alterações: `npm run typecheck`, `npm run audit:routes` ( `/proposals` deve passar para “código ativo”).
