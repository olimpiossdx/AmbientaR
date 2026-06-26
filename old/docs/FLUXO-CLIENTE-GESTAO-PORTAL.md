# Fluxo Cliente Gestão — portal por convite (consultoria primeiro)

Documento de referência acordado para a Fase 1. O titular **Cliente Gestão** não se cadastra em `/register`; o acesso nasce no cadastro comercial e é liberado pelo **administrador**.

## Decisões de produto

| Tema | Decisão |
|------|---------|
| Cliente Autônomo | Mantém **cadastro público** (`/register`) — planos self-service |
| Cliente Gestão | **Sem** auto-cadastro público; convite só pelo admin |
| Pacote / contrato / pagamento (Gestão) | Considerados **OK** no momento do convite (definidos offline ou no cadastro CRM) |
| Quem cria acesso portal | **Somente admin** |
| Vários logins por empresa | **Fase 1** — mesmo `clientId`, vários `users` com `linkedClientId` |

## Fluxo operacional

```text
Empreendedor / contrato (offline)
    ↓
Consultoria cadastra Cliente + Empreendedor (CRM / Cadastro → Clientes)
    ↓
Admin: Configurações → Usuários ou Clientes → "Criar acesso ao portal"
    ↓
Sistema: Auth + users (status pending_invite) + vínculo linkedClientId
    ↓
E-mail: definir senha (sendPasswordResetEmail — sem senha padrão)
    ↓
Primeiro login → status active → Portal titular
```

## Cadastro público (`/register`)

**Mantém:**

- Cliente Autônomo (planos, contrato e pagamento no funil)
- Representante
- Consultor-Representante

**Remove:**

- Cliente Gestão (titular com assessoria)

Links antigos `?tipo=client` devem orientar o utilizador a contactar a consultoria ou fazer login se já tiver convite.

## Modelo de dados

### Cliente (empresa) — `clients/{id}`

Entidade comercial; não é login.

- `cpfCnpj`, `name`, `email`, projetos, etc.
- `userId` — titular principal do portal (opcional; primeiro convite)
- `portalUserIds[]` — UIDs com acesso portal vinculado (Fase 1, vários logins)

### Usuário portal — `users/{uid}`

- `role`: `client`
- `status`: `pending_invite` | `active` | `inactive`
- `linkedClientId` / `linkedEmpreendedorId` — vínculo ao cadastro existente
- `package`, `platformPaymentStatus`, etc. — preenchidos no convite (já contratado)

### Relação

```text
Cliente (clients)
    ├── portalUserIds[]  →  N × Usuário (users, role client)
    └── userId (opcional, primeiro titular)
```

## Ativação e segurança

1. Admin cria utilizador via **Firebase Admin SDK** (senha aleatória não comunicada).
2. Cliente recebe e-mail **definir senha** (`sendPasswordResetEmail` após criação — sem senha padrão).
3. `pending_invite` até o primeiro login bem-sucedido; depois `active`.
4. Revogação: `inactive` pelo admin (como hoje).

## Papéis

| Ação | Admin | Comercial / gestor |
|------|-------|-------------------|
| Cadastrar Cliente/Empreendedor | Sim | Sim (CRM/Cadastro) |
| Criar / reenviar acesso portal Gestão | Sim | Não |
| Cliente Autônomo público | — | — (self-service) |

## Implementação (Fase 1)

1. Remover opção Cliente Gestão em `/register`.
2. API `POST /api/admin/create-portal-access` (admin bearer).
3. UI em **Clientes** (visualizar) — "Criar acesso ao portal" + lista de utilizadores vinculados.
4. Escopo portal: `linkedClientId` + `portalUserIds` para titulares adicionais.
5. Migração: contas antigas via `/register` continuam válidas.

## Fase 2 (fora do escopo imediato)

- Automação CRM → projeto → convite.
- Papéis portal granulares (somente leitura).
- E-mail transacional próprio (template “bem-vindo”) em vez de só reset de senha.

## Referências no código

- `src/lib/admin/create-portal-access.ts` — criação servidor
- `src/app/api/admin/create-portal-access/route.ts` — API
- `src/components/clients/create-portal-access-dialog.tsx` — UI admin
- `src/lib/requests-portal-empreendedor-ids.ts` — escopo titular com `linkedClientId`
