# Mapeamento dos fluxos públicos de autenticação

Este documento mapeia os fluxos públicos da pasta `old` para a arquitetura da pasta `new`. A primeira etapa é preservar o comportamento funcional existente, mas mover a responsabilidade de autenticação, cadastro e validações sensíveis para uma API, deixando o front novo apenas com UI, validação de entrada e chamadas de serviço.

## Escopo inicial

Rotas antigas analisadas:

- `old/src/app/login/page.tsx`
- `old/src/app/login/login-view.tsx`
- `old/src/app/login/login-form.tsx`
- `old/src/app/forgot-password/page.tsx`
- `old/src/app/forgot-password/forgot-password-view.tsx`
- `old/src/app/register/page.tsx`
- `old/src/app/register/register-view.tsx`
- `old/src/app/api/auth/resolve-identifier/route.ts`
- `old/src/app/api/auth/check-document-available/route.ts`
- `old/src/app/api/auth/register-identity/route.ts`
- `old/src/app/api/auth/post-login-sync/route.ts`

Rotas/serviços novos analisados:

- `new/src/router.tsx`
- `new/src/auth/index.tsx`
- `new/src/auth/login-form.tsx`
- `new/src/auth/auth-service.ts`
- `new/src/auth/auth-provider.tsx`
- `new/src/auth/auth-store.ts`
- `new/src/service/api.ts`

## Estado atual no `new`

O novo front já tem:

- Rota `/login`.
- Layout público compartilhado em `PublicAuthLayout`.
- `LoginForm` com chamada para `authService.login`.
- `AuthProvider`, `authStore`, `authRouterContext` e interceptors para sessão por API.
- Contrato atual de sessão:
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `POST /auth/relogin`
  - `GET /auth/session`

Pontos ainda pendentes:

- Não existem rotas novas para `/register` e `/forgot-password`.
- Os links do login novo apontam para `/register` e `/forgot-password`, mas essas rotas ainda não estão registradas no TanStack Router.
- O login antigo aceitava e-mail, CPF ou CNPJ; o login novo visualmente diz isso, mas a validação atual aceita apenas e-mail.
- O contrato `LoginModel` espera `username`, mas o input atual usa `name="userName"`. Isso deve ser corrigido na primeira virada do login.

## Fluxo 1: Login

### Comportamento antigo

Arquivos principais:

- `old/src/app/login/login-form.tsx`
- `old/src/firebase/provider.tsx`
- `old/src/lib/auth/login-client.ts`
- `old/src/app/api/auth/resolve-identifier/route.ts`
- `old/src/app/api/auth/post-login-sync/route.ts`

Entrada:

- `identifier`: e-mail, CPF ou CNPJ.
- `password`: senha.

Passos do antigo:

1. Valida `identifier` como e-mail, CPF ou CNPJ.
2. Se for documento, chama `POST /api/auth/resolve-identifier`.
3. O endpoint busca o e-mail associado ao documento em `login_identities` e fallback em campos de `users`.
4. Faz login com Firebase Auth usando e-mail resolvido e senha.
5. Carrega perfil do usuário em Firestore.
6. Atualiza `lastLogin`, presença e auditoria.
7. Chama `POST /api/auth/post-login-sync` para sincronizar vínculo de empreendedor/cliente.
8. O layout autenticado redireciona para a área interna.

### Destino na arquitetura nova

Front novo:

- `new/src/auth/login-form.tsx`
- `new/src/auth/auth-service.ts`
- `new/src/auth/auth-provider.tsx`
- `new/src/auth/auth-store.ts`

API nova esperada:

- `POST /auth/login`

Contrato sugerido:

```ts
type LoginRequest = {
  username: string; // e-mail, CPF ou CNPJ
  password: string;
};

type AuthSessionData = {
  user: {
    id: number | string;
    nome: string;
    username: string;
    email?: string;
    role?: string;
  };
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};
```

Responsabilidade da API:

- Validar e normalizar e-mail/CPF/CNPJ.
- Resolver documento para usuário.
- Validar senha.
- Executar sincronização pós-login que hoje está em `/api/auth/post-login-sync`.
- Emitir sessão/cookies/tokens no formato consumido pelo `authStore`.
- Retornar erro genérico para credenciais inválidas, evitando expor se documento/e-mail existe.

Responsabilidade do front:

- Validar formato básico do identificador.
- Enviar `username` e `password`.
- Persistir sessão recebida via `authStore`.
- Redirecionar para `redirect` ou `/app`.

## Fluxo 2: Recuperação de senha

### Comportamento antigo

Arquivo principal:

- `old/src/app/forgot-password/forgot-password-view.tsx`

Entrada:

- `email`.

Passos do antigo:

1. Valida e-mail.
2. Chama `sendPasswordResetEmail(auth, email)` diretamente no Firebase Auth.
3. Mostra toast de sucesso ou erro.
4. Permite voltar para `/login`.

### Destino na arquitetura nova

Nova rota necessária:

- `/forgot-password`

Novo serviço sugerido:

- `new/src/auth/forgot-password-form.tsx`
- `new/src/auth/forgot-password-view.tsx`

API nova esperada:

- `POST /auth/password-reset`

Contrato sugerido:

```ts
type PasswordResetRequest = {
  email: string;
};
```

Responsabilidade da API:

- Validar e normalizar e-mail.
- Disparar recuperação no provedor de identidade.
- Retornar sucesso genérico mesmo se o e-mail não existir, se a política de segurança exigir não enumerar usuários.

Responsabilidade do front:

- Validar formato de e-mail.
- Exibir confirmação.
- Manter link de retorno para `/login`.

## Fluxo 3: Cadastro público

### Comportamento antigo

Arquivo principal:

- `old/src/app/register/register-view.tsx`

Entradas principais:

- Tipo de perfil: `cliente_autonomo`, `representative`, `consultor_representante`.
- Dados pessoais: nome, e-mail, telefone, CPF.
- Documento do titular/empreendedor base: CPF ou CNPJ.
- Pacote contratado.
- Aceite de contrato.
- Consentimento comercial para pacotes que exigem opt-in.
- Forma de pagamento: PIX, cartão de crédito ou débito.

Passos do antigo:

1. Define modo inicial por query param `tipo`.
2. Bloqueia auto-cadastro de `client`/Cliente Gestão por convite.
3. Para Cliente Autônomo, exige CPF/CNPJ do titular/empreendedor base.
4. Ao sair do campo de CPF/CNPJ:
   - busca dados públicos de CNPJ;
   - tenta encontrar `client`/`empreendedor` existente;
   - preenche nome/e-mail/telefone quando possível;
   - prepara vínculo sem duplicar registros.
5. Para representante/consultor, exige CPF pessoal.
6. Verifica disponibilidade do documento com `POST /api/auth/check-document-available`.
7. Cria usuário no Firebase Auth.
8. Cria/mescla documento em `users`.
9. Registra identidade de login por documento com `POST /api/auth/register-identity`.
10. Para Cliente Autônomo:
    - registra aceite de contrato em `/api/platform-subscription-contract/record`;
    - pode gerar cobrança em `/api/billing/create-charge`;
    - cria ou atualiza `clients` e `empreendedores`.
11. Redireciona para `/` quando não há PIX pós-cadastro.

### Destino na arquitetura nova

Nova rota necessária:

- `/register`

Novos componentes sugeridos:

- `new/src/auth/register-view.tsx`
- `new/src/auth/register-form.tsx`
- `new/src/auth/register-profile-step.tsx`
- `new/src/auth/register-package-step.tsx`
- `new/src/auth/register-contract-step.tsx`
- `new/src/auth/register-payment-step.tsx`

API nova esperada:

- `POST /auth/register`
- `POST /auth/register/document-preview`
- `POST /auth/check-document-available`
- `POST /billing/create-charge`
- `POST /platform-subscription-contract/record`

Contrato sugerido para cadastro:

```ts
type RegisterMode =
  | "cliente_autonomo"
  | "representative"
  | "consultor_representante";

type RegisterRequest = {
  mode: RegisterMode;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  cpfCnpjTitular?: string;
  password: string;
  selectedPackage?: string;
  contractAccepted: boolean;
  marketingContactConsent?: boolean;
  payment?: {
    method: "pix" | "credit_card" | "debit_card";
    billingMode?: "annual_upfront" | "monthly_12x";
    acknowledged: boolean;
    cardDisplay?: {
      holderName: string;
      last4: string;
      expiryMonth: string;
      expiryYear: string;
      brand?: string;
    };
  };
};
```

Contrato sugerido para preview de documento:

```ts
type RegisterDocumentPreviewRequest = {
  mode: "cliente_autonomo";
  document: string;
};

type RegisterDocumentPreviewResponse = {
  cnpjLookupStatus: "not_applicable" | "success" | "failed" | "not_found";
  linkedClientId?: string | null;
  linkedEmpreendedorId?: string | null;
  suggestedFields?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  message?: string;
};
```

Responsabilidade da API:

- Validar regras de perfil.
- Validar CPF/CNPJ e disponibilidade de identidade.
- Criar credencial de autenticação.
- Criar/mesclar perfil de usuário.
- Registrar identidade de login.
- Vincular ou criar `client`/`empreendedor`.
- Registrar contrato e pagamento.
- Retornar sessão ou instrução de pagamento pendente.

Responsabilidade do front:

- Controlar wizard visual.
- Validar campos básicos por etapa.
- Chamar preview de documento no blur.
- Chamar cadastro final uma única vez.
- Renderizar PIX pós-cadastro quando a API retornar cobrança.

## Fluxo 4: Identidades de login por documento

### Comportamento antigo

Arquivos principais:

- `old/src/lib/auth/login-identities.ts`
- `old/src/app/api/auth/resolve-identifier/route.ts`
- `old/src/app/api/auth/check-document-available/route.ts`
- `old/src/app/api/auth/register-identity/route.ts`

Coleção antiga:

- `login_identities`

Regras:

- Documento é chave normalizada apenas com dígitos.
- Documento aponta para `uid`, `email` e tipo `cpf` ou `cnpj`.
- Resolver por documento primeiro consulta `login_identities`.
- Fallback consulta `users` por `cpf`, `userCpf` e `titularDocument`.

### Destino na arquitetura nova

Manter o mesmo conceito na API nova, mesmo que a persistência mude depois.

Endpoints sugeridos:

- `POST /auth/resolve-identifier` somente se a API de login não resolver internamente.
- `POST /auth/check-document-available`
- `POST /auth/register-identity` somente para fluxos administrativos; no cadastro público, preferir que `POST /auth/register` faça isso internamente.

Para o front novo, o ideal é não chamar `resolve-identifier` antes de login. O front envia `username`, e a API resolve tudo dentro de `POST /auth/login`.

## Fluxo 5: Sessão bloqueada e relogin

### Estado atual no novo

Arquivos principais:

- `new/src/auth/session-lock-modal.tsx`
- `new/src/auth/auth-interceptors.ts`
- `new/src/auth/auth-store.ts`

Comportamento:

- Sessão conhecida pode hidratar como `locked`.
- Erro 401 em chamadas autenticadas tenta refresh.
- Se refresh falhar, trava sessão.
- Modal de relogin chama `POST /auth/relogin`.

Esse fluxo já pertence à arquitetura nova e deve ser mantido. A única integração necessária é garantir que os endpoints de cadastro/login retornem `AuthSessionData` no mesmo formato.

## Ordem sugerida das viradas

1. Corrigir login novo para enviar `username`, aceitar e-mail/CPF/CNPJ e centralizar a resolução no endpoint `POST /auth/login`.
2. Adicionar rota `/forgot-password` no TanStack Router e implementar `POST /auth/password-reset`.
3. Adicionar rota `/register` com wizard mínimo equivalente ao antigo.
4. Migrar preview de CPF/CNPJ para `POST /auth/register/document-preview`.
5. Migrar submit completo do cadastro para `POST /auth/register`.
6. Remover chamadas diretas de Firebase/Auth/Firestore do front público novo.
7. Revisar mensagens, loading states e redirects para manter a experiência do antigo.

## Checklist de paridade antes de virar produção

- Login com e-mail funciona.
- Login com CPF funciona.
- Login com CNPJ funciona.
- Login com documento inexistente não revela se o documento existe.
- Recuperação de senha exibe sucesso genérico.
- Cadastro de Cliente Autônomo cria usuário, perfil, identidade de login e vínculo base.
- Cadastro de Representante cria usuário com `pendingAccess` e `onboardingStep`.
- Cadastro de Consultor Representante cria usuário com `pendingAccess` e `onboardingStep`.
- Documento já cadastrado bloqueia cadastro.
- CNPJ válido preenche sugestões quando a API retornar dados públicos.
- Cadastro com pacote gratuito entra sem cobrança.
- Cadastro com pacote pago retorna cobrança ou status pendente.
- Aceite de contrato é registrado.
- Após login/cadastro, `/app` reconhece sessão pela arquitetura nova.
