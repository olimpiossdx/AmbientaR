# Melhorias do menu Financeiro (implementação)

## Fase 1 — Consistência dos dados

| Item | Onde |
|------|------|
| Orçamentos unificados com Propostas Comerciais | Menu **Orçamentos e Propostas**; URLs `/proposals` redirecionam para `/commercial-proposals` |
| Migração legado `proposals` → `commercialProposals` | API `POST /api/admin/migrate-proposals` (admin + bearer) |
| DRE sem dupla contagem | **DRE Contábil** → regime **Faturas pagas + caixa sem vínculo** |
| Fatura paga → receita no caixa | Ao salvar fatura como **Paga**, diálogo opcional |
| Faturas vencidas → Atrasada | Automático ao abrir **Faturas** (admin/financeiro) |
| Despesas: categoria, fornecedor, centro de custo | **Lançamentos de Caixa** → formulário despesa/receita |

## Fase 2 — Controle gerencial

| Item | Rota |
|------|------|
| Painel financeiro (KPIs) | `/financial/painel` |
| Fluxo de caixa projetado (90 dias) | `/financial/fluxo-projetado` |
| Conciliação bancária CSV | `/financial/conciliacao` |
| Curva ABC serviços | `/financial/abc-servicos` |
| Curva ABC fornecedores | `/financial/abc-fornecedores` |
| Orçamento anual | `/financial/orcamento` (Firestore `financial_budgets`) |
| Depreciação mensal | **Bens e Patrimônio** → botão *Depreciação do mês* |
| Assistente IA financeiro | Menu → **Assistente Financeiro (IA)** |

## Fase 3 — Exportação

| Item | Rota |
|------|------|
| Pacote CSV contábil | `/financial/export-contabil` |

## Deploy

Após atualizar código: `npm run deploy:rules` (regras `financial_budgets`).

## Projetos & ROI (Fase 1)

| Item | Rota / notas |
|------|----------------|
| Lista e sincronização de casos | `/financial/projetos-roi` |
| Detalhe, extrato, lançamento vinculado | `/financial/projetos-roi/[caseId]` |
| Coleção Firestore | `project_roi_cases`, `project_roi_governance_reminders` |
| Spec | `docs/financeiro-projetos-roi.md` |
| Regras | `npm run deploy:rules` após pull |

## Pendências (fora deste lote)

- Open Finance / Acesso Bancário real
- Integração NFS-e automática
- Export SPED/LALUR
- Parcelamento contrato → faturas em lote
- Vínculo visual processo (`requests`) nos formulários (hoje: campo `requestId` texto)
