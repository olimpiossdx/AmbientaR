# Refinamento: autenticação básica AmbientaR + ambientaR-api

Este refinamento define a primeira entrega funcional de autenticação entre o front `AmbientaR/new` e o backend `ambientaR-api`.

O objetivo desta etapa não é migrar todo o fluxo legado de cadastro, cobrança, contratos, regras de acesso e recuperação de senha. A primeira entrega deve garantir apenas:

1. Cadastro de usuário.
2. Login na aplicação.

Recuperação de senha entra como contrato preparado, mas fora do básico obrigatório desta primeira virada.

Decisão atual: usar o próprio `UserModel` para o cadastro parcial. O usuário deve conseguir se cadastrar, autenticar e acessar a plataforma. Os dados cadastrais completos serão complementados depois em telas internas.

## Estado atual encontrado

### AmbientaR/new

Arquivos principais:

- `new/src/auth/login-form.tsx`
- `new/src/auth/register-view.tsx`
- `new/src/auth/forgot-password-view.tsx`
- `new/src/auth/auth-service.ts`
- `new/src/auth/auth.types.ts`
- `new/src/router.tsx`
- `new/docs/auth-flows-mapping.md`

O front novo já possui:

- Rota `/login`.
- Rota `/register`.
- Rota `/forgot-password`.
- `authService` apontando para:
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh`
  - `POST /auth/relogin`
  - `GET /auth/session`
  - `POST /auth/password-reset`
  - `POST /auth/register`
  - `POST /auth/register/document-preview`
- Login enviando `username` e `password`.
- Validação de identificador aceitando e-mail, CPF ou CNPJ.
- Cadastro mínimo com perfil, documento, nome, e-mail, telefone e senha.

### ambientaR-api

Arquivos principais:

- `src/controllers/auth.controller.ts`
- `src/services/auth.service.ts`
- `src/services/user.service.ts`
- `src/controllers/user/controller.ts`
- `src/controllers/user/viewModel.ts`
- `src/models/user.model.ts`
- `src/schemas/user.schema.ts`
- `src/repositories/implementations/user.repository.ts`
- `src/services/application/user-application.service.ts`

O backend já possui:

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/refresh-token`
- `POST /auth/relogin`
- `GET /auth/session`
- `GET /auth/profile`
- CRUD básico em `Controller('user')`.
- Modelo `UserModel` persistido na coleção `User`.
- Índices únicos para `email` e `entityType + cpfCnpj`.
- Emissão de access token e refresh token em cookies.

Lacunas para a primeira entrega:

- `AuthService` autentica contra `UserService`, que hoje usa lista fixa em memória.
- `UserModel` não possui senha/hash de senha.
- Não existe `POST /auth/register`.
- Não existe resolução real de login por CPF/CNPJ.
- `AuthUserDto.id` está tipado como `number`, mas o usuário persistido no Mongo usa `ObjectId`.
- `UserModel` exige campos de endereço que não existem no cadastro mínimo do front; isso deve mudar para permitir cadastro parcial.
- `UserModel` ainda não representa o `mode` do cadastro público como enum.
- Recuperação de senha ainda não existe no backend.

## Entrega 1: Cadastro mínimo

### Objetivo

Criar uma conta utilizável pelo AmbientaR com o mínimo de dados necessário para login posterior.

### Endpoint

`POST /auth/register`

### Request

```ts
type RegisterRequest = {
  mode: UserRegistrationMode;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  cpfCnpjTitular?: string;
  password: string;
  selectedPackage?: string;
  contractAccepted: boolean;
  marketingContactConsent?: boolean;
};

enum UserRegistrationMode {
  CLIENTE_AUTONOMO = "cliente_autonomo",
  REPRESENTATIVE = "representative",
  CONSULTOR_REPRESENTANTE = "consultor_representante",
}
```

### Regras da primeira entrega

- Normalizar `email` para lowercase e trim.
- Normalizar CPF/CNPJ para apenas dígitos.
- Para `cliente_autonomo`, exigir `cpfCnpjTitular` válido.
- Para `representative` e `consultor_representante`, exigir `cpf` válido.
- Exigir senha com mínimo de 6 caracteres.
- Bloquear e-mail já cadastrado.
- Bloquear documento já cadastrado para o mesmo `entityType`.
- Salvar senha com hash `bcrypt`.
- Criar usuário parcial no próprio `UserModel`, sem forçar endereço ou dados cadastrais completos.
- Persistir `mode` no usuário usando enum do domínio.
- Marcar o cadastro como parcial, para que outras telas completem os dados depois.
- Retornar sessão autenticada quando o cadastro for concluído.

### Ajuste no UserModel para cadastro parcial

O `UserModel` deve aceitar um estado inicial parcial. Em vez de preencher endereço com valores falsos, a API deve tornar os campos complementares opcionais ou nulos.

Campos novos sugeridos:

```ts
enum UserRegistrationMode {
  CLIENTE_AUTONOMO = "cliente_autonomo",
  REPRESENTATIVE = "representative",
  CONSULTOR_REPRESENTANTE = "consultor_representante",
}

enum UserOnboardingStatus {
  PARTIAL = "partial",
  COMPLETE = "complete",
}

class UserModel {
  registrationMode?: UserRegistrationMode;
  onboardingStatus: UserOnboardingStatus;
  passwordHash: string;
}
```

Campos que devem deixar de ser obrigatórios no cadastro parcial:

- `cep`
- `logradouro`
- `numero`
- `bairro`
- `municipio`
- `uf`
- `rg`
- `emissor`
- `dataNascimento`
- `estadoCivil`
- `ctfIbama`

Payload persistido sugerido:

```ts
{
  registrationMode: mode,
  onboardingStatus: "partial",
  tipo: document.length === 14 ? "JURIDICA" : "FISICA",
  cpfCnpj: document,
  entityType: "CLIENTE",
  nome: name,
  email,
  telefone: phone,
  nacionalidade: "Brasileira",
  passwordHash
}
```

O método atual `validarCreate` deve ser dividido em duas intenções:

- `createPartial`: valida apenas dados mínimos de autenticação e identificação.
- `completeRegistration` ou `update`: valida dados cadastrais completos, incluindo endereço.

Assim evitamos gravar placeholders e mantemos o domínio honesto desde o começo.

### Response

```ts
type RegisterResult = {
  session?: AuthSessionData;
  status: "active";
};

type AuthSessionData = {
  user: {
    id: string;
    nome: string;
    username: string;
    email?: string;
    role?: string;
  };
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};
```

Para a entrega básica, todos os modos retornam `status: "active"` e sessão. Regras de acesso, aprovação, convite e escopos por perfil ficam fora desta primeira virada.

## Entrega 2: Login funcional

### Objetivo

Permitir acesso à aplicação usando e-mail, CPF ou CNPJ e senha.

### Endpoint

`POST /auth/login`

### Request

```ts
type LoginRequest = {
  username: string;
  password: string;
};
```

### Regras

- Se `username` contém `@`, tratar como e-mail.
- Se não contém `@`, normalizar para dígitos e tratar como CPF/CNPJ.
- Buscar usuário por:
  - `email` normalizado, ou
  - `cpfCnpj` normalizado.
- Comparar senha usando `bcrypt.compare`.
- Retornar erro genérico `Credenciais inválidas.` para usuário inexistente ou senha incorreta.
- Emitir cookies de access token e refresh token.
- Retornar o mesmo contrato `AuthSessionData` já consumido pelo front.
- Não bloquear login por `registrationMode` nesta etapa.
- Não bloquear login por `onboardingStatus: "partial"` nesta etapa.

### Ajustes necessários no backend

- Trocar `UserService.findOne(username)` para consultar o repositório real.
- Permitir `sub` do JWT como `string`, pois Mongo usa `ObjectId`.
- Atualizar `AuthUserDto.id` de `number` para `string`.
- Ajustar `findUserFromPayload` para comparar `user.id.toString()` com `payload.sub`.
- Remover dependência da lista fixa em memória para login real.

## Entrega 3: Preview de documento

### Objetivo

Manter a tela de cadastro atual funcionando e preparar chamadas assíncronas no hook/form do front sem acoplar a validação visual ao submit final.

### Endpoint

`POST /auth/register/document-preview`

### Request

```ts
type RegisterDocumentPreviewRequest = {
  mode: "cliente_autonomo";
  document: string;
};
```

### Response mínima

```ts
type RegisterDocumentPreview = {
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

Para a primeira entrega, este endpoint pode apenas:

- Validar CPF/CNPJ.
- Consultar se já existe usuário com `cpfCnpj`.
- Normalizar o documento do mesmo jeito que `POST /auth/register`.
- Retornar mensagem simples:
  - documento disponível;
  - documento já cadastrado;
  - documento inválido.

Consulta pública de CNPJ, vínculo com cliente/empreendedor e autopreenchimento ficam para etapa posterior.

Este endpoint deve permanecer na API mesmo quando for simples, porque ele dá um ponto estável para validações assíncronas do front. Depois ele pode evoluir para enriquecer o retorno com dados de CNPJ, vínculos e sugestões sem mudar o fluxo da tela.

## Entrega 4: Recuperação de senha

Esta entrega fica planejada, mas não bloqueia o básico.

### Endpoint futuro

`POST /auth/password-reset`

### Request

```ts
type PasswordResetRequest = {
  email: string;
};
```

### Regra de segurança

Sempre retornar sucesso genérico:

> Se o e-mail existir no AmbientaR, enviaremos as instruções de redefinição.

Implementação real depende da definição do provedor de e-mail e do modelo de token de recuperação.

## Backlog técnico detalhado

### API

1. Adicionar campos de autenticação e onboarding ao `UserModel`.
   - `passwordHash: string`
   - `registrationMode: UserRegistrationMode`
   - `onboardingStatus: UserOnboardingStatus`
   - opcional futuro: `passwordResetTokenHash`, `passwordResetExpiresAt`, `lastLoginAt`

2. Atualizar `UserModelSchema`.
   - Mapear `passwordHash`.
   - Mapear `registrationMode` como enum.
   - Mapear `onboardingStatus` como enum.
   - Tornar campos cadastrais complementares nullable/opcionais para permitir cadastro parcial.

3. Ajustar criação/validação do `UserModel`.
   - Criar método/intenção `createPartial`.
   - Manter validação completa para telas internas que completam cadastro.
   - Evitar placeholders como `uf: "NA"` ou endereço "Não informado".

4. Criar métodos no `UserRepository`.
   - `findByEmail(email: string)`
   - `findByDocument(cpfCnpj: string)`
   - `existsByEmail(email: string)`
   - `existsByDocument(entityType: string, cpfCnpj: string)`

5. Criar serviço de cadastro em auth.
   - Pode ser `AuthRegistrationService` ou método em `AuthService`.
   - Deve receber `RegisterRequest`, validar, criar usuário e gerar sessão.
   - Deve sempre liberar sessão nesta primeira etapa.

6. Criar DTOs ou tipos de request para auth.
   - `LoginBody`
   - `RegisterBody`
   - `RegisterDocumentPreviewBody`
   - `PasswordResetBody`

7. Implementar endpoints novos no `AuthController`.
   - `POST /auth/register`
   - `POST /auth/register/document-preview`
   - `POST /auth/password-reset` com resposta mockada/genérica até implementação real.

8. Atualizar login para repositório real.
   - Remover autenticação por lista fixa.
   - Manter fallback para senha sem hash apenas se ainda houver necessidade local temporária.

9. Atualizar JWT/session para ID string.
   - `JwtAuthPayload.sub: string`
   - `AuthUserDto.id: string`

10. Testes mínimos na API.
   - cadastro com sucesso;
   - cadastro bloqueia e-mail duplicado;
   - cadastro bloqueia documento duplicado;
   - cadastro parcial não exige endereço;
   - cadastro persiste `registrationMode`;
   - cadastro persiste `onboardingStatus: "partial"`;
   - login com e-mail;
   - login com CPF/CNPJ;
   - login de usuário parcial;
   - login com senha errada retorna 401 genérico.

### Front

1. Manter `new/src/auth/login-form.tsx` enviando `username`.
2. Manter validação de e-mail/CPF/CNPJ em `new/src/auth/auth-validation.ts`.
3. Manter todos os modos de cadastro redirecionando para `/app` quando a API retornar sessão.
4. Garantir que `authStore.setAuthenticated(session)` receba `id` string sem quebrar.
5. Tratar erros de duplicidade no cadastro por campo quando a API enviar `field`.
6. Manter `/forgot-password` visível, mas com backend genérico até a recuperação real.
7. Usar `POST /auth/register/document-preview` para validações async do hook/form antes do submit.

## Critérios de aceite

### Cadastro

- Usuário consegue abrir `/register`.
- `cliente_autonomo` exige CPF/CNPJ do titular.
- Representante exige CPF pessoal.
- Nome, e-mail, telefone, senha e confirmação são validados.
- Senhas diferentes bloqueiam envio.
- Documento inválido bloqueia envio.
- E-mail duplicado bloqueia cadastro com mensagem clara.
- Documento duplicado bloqueia cadastro com mensagem clara.
- Cadastro parcial não exige endereço.
- Cadastro persiste `mode` no usuário.
- Cadastro persiste `onboardingStatus: "partial"`.
- Cadastro de qualquer modo inicial cria conta, autentica e entra em `/app`.

### Login

- Login por e-mail funciona.
- Login por CPF funciona.
- Login por CNPJ funciona.
- Senha inválida retorna erro genérico.
- Usuário inexistente retorna erro genérico.
- Cookies de sessão são gravados.
- Refresh/session continuam funcionando após recarregar a página.
- `/app` bloqueia usuário anônimo e libera usuário autenticado.
- `/app` libera usuário com cadastro parcial.

### Recuperação de senha

- `/forgot-password` abre.
- Envio de e-mail chama `POST /auth/password-reset`.
- A resposta visual é genérica e não enumera usuário.

## Fora de escopo da primeira entrega

- Cobrança PIX/cartão.
- Registro definitivo de contrato.
- Integração com provedor real de e-mail.
- Convites e aprovação de representantes.
- Regras de acesso por `registrationMode`.
- Sincronização completa com clientes/empreendedores.
- Complemento cadastral obrigatório antes de uso.
- Migração completa do Firebase/Firestore legado.
- Auditoria detalhada de login.
- Múltiplos perfis e permissões completas.

## Ordem recomendada de implementação

1. API: ajustar `UserModel` e schema para cadastro parcial.
2. API: adicionar `passwordHash`, `registrationMode` e `onboardingStatus`.
3. API: implementar criação parcial sem endereço obrigatório.
4. API: implementar busca real de usuário por e-mail/documento.
5. API: ajustar login/JWT para `ObjectId` string.
6. API: implementar `POST /auth/register`.
7. API: implementar `POST /auth/register/document-preview` mínimo.
8. API: adicionar `POST /auth/password-reset` genérico.
9. Front: validar cadastro/login contra API local.
10. Front: ajustar mensagens conforme erros reais da API.
11. Rodar testes e smoke test manual dos fluxos `/register`, `/login`, `/app`.
