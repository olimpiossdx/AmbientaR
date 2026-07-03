# Login por e-mail, CPF ou CNPJ

Autenticação continua via **Firebase Auth (e-mail + senha)**. O CPF ou CNPJ é apenas um **identificador alternativo** que a API resolve para o e-mail cadastrado antes do `signInWithEmailAndPassword`.

## Fluxo

1. Utilizador informa **e-mail, CPF ou CNPJ** + senha em `/login`.
2. Se for documento, `POST /api/auth/resolve-identifier` devolve o e-mail (Admin SDK, coleção `login_identities` + fallback em `users`).
3. Login Firebase com e-mail + senha (inalterado para contas existentes).
4. Após login, `POST /api/auth/post-login-sync` tenta vincular `linkedClientId` / `linkedEmpreendedorId` pelo documento do perfil.

## Cadastro

- **Documento único obrigatório** por conta (CPF para representantes; CPF/CNPJ do titular para Cliente Autônomo).
- Antes de criar a conta: `POST /api/auth/check-document-available`.
- Após `createUserWithEmailAndPassword` e gravação do perfil: `POST /api/auth/register-identity` (Bearer).

## Coleção Firestore `login_identities`

| Campo | Descrição |
|-------|-----------|
| ID do documento | Apenas dígitos (11 = CPF, 14 = CNPJ) |
| `uid` | Utilizador Firebase |
| `email` | E-mail de login |
| `documentType` | `cpf` ou `cnpj` |

Regras: **sem acesso cliente** — apenas Admin SDK (`npm run deploy:rules`).

## APIs

| Rota | Auth | Função |
|------|------|--------|
| `POST /api/auth/resolve-identifier` | Pública (rate limit) | Documento → e-mail |
| `POST /api/auth/check-document-available` | Pública (rate limit) | Verifica unicidade |
| `POST /api/auth/register-identity` | Bearer Firebase | Regista documento após cadastro |
| `POST /api/auth/post-login-sync` | Bearer Firebase | Vincula empreendedor/cliente |

## Backfill de contas antigas

Contas criadas antes desta funcionalidade não têm entrada em `login_identities`. Para permitir login por documento:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="E:\caminho\service-account.json"
node scripts/backfill-login-identities.mjs
# Simulação: $env:DRY_RUN="true"; node scripts/backfill-login-identities.mjs
```

## Recuperação de senha

Continua **apenas por e-mail** (`/forgot-password`). Quem entra só por CPF/CNPJ deve usar o e-mail cadastrado na recuperação.

## Migração a partir do gov.br

O login gov.br foi removido. Utilizadores com `pending_registration` ou e-mail placeholder `@ambientar.local` devem concluir cadastro em `/register` com e-mail e senha reais.
