# Auditoria — Cadastro

## Menu

| Rota | Label | Coleção |
|------|-------|---------|
| `/empreendedores` | Empreendedores | `empreendedores` |
| `/projects` | Empreendimentos | `projects` |
| `/responsible-company` | Empresas | `environmentalCompanies` + `companySettings/platformContractPublic` (empresa ativa para contrato/pagamento) |

## Órfã / legado

| Rota | Situação | Ação |
|------|----------|------|
| `/environmental-company` | Duplicata antiga da mesma coleção | 🔧 redirect → `/responsible-company` |

`company-form.tsx` na pasta legada permanece no repo até fase React (remover se confirmado sem imports).

## Typecheck

Sem erros conhecidos neste módulo.
