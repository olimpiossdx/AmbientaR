# Plano de implementação — autenticação e autorização por claims

## 1. Objetivo

Centralizar as decisões de autorização nas claims recebidas na sessão, sem autorização baseada em perfil, role, tipo especial de usuário, nome, login ou regra `isAdmin`.

A identidade informa quem é o usuário. As claims informam o que ele pode acessar ou executar.

O frontend controla navegação e experiência. A API continua sendo a autoridade final e deve validar as mesmas claims em todas as operações protegidas.

---

## 2. Decisões consolidadas

1. Cada claim possui somente `claimType` e `claimValue`.
2. As claims serão declaradas diretamente em rotas, menus e ações; não serão criadas constantes como `USERS_CLAIMS.view`.
3. `claimType` e `claimValue` serão comparados sem diferença entre letras maiúsculas e minúsculas.
4. O frontend não inferirá relações entre claims. `criar` não implica `visualizar`.
5. Claims declaradas nos ancestrais da árvore são requisitos cumulativos.
6. Quem configurar as permissões será responsável por garantir a coerência entre claims de pais e filhos.
7. O snapshot da sessão será persistido no `localStorage`.
8. O snapshot e o índice de claims terão cópias em memória para evitar leitura e desserialização do `localStorage` em cada consulta.
9. As consultas em memória não geram renderização nem notificações.
10. Renderizações ocorrerão somente quando houver uma transição real da sessão, como login, refresh, bloqueio, reautenticação, troca de usuário ou logout.
11. Um F5 com sessão local válida não fará chamada obrigatória para `/auth/session`.
12. Sessão expirada, bloqueada ou com refresh malsucedido exibirá o modal de reautenticação do usuário conhecido.
13. Um único registro estático de módulos produzirá a árvore de rotas e a navegação.
14. Os valores dos tokens não serão armazenados no `localStorage`; eles permanecem em cookies seguros. Serão armazenados somente usuário, claims, expirações e estado necessário para recuperação da interface.

---

## 3. Contratos

```ts
export type AuthClaim = {
  claimType: string;
  claimValue: string;
};

export type ClaimRequirement = {
  claimType: string;
  claimValue: string;
};

export type AuthUser = {
  id: string | number;
  nome: string;
  username: string;
};

export type AuthSessionData = {
  user: AuthUser;
  claims: readonly AuthClaim[];
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt: number;
};
```

Exemplo recebido da API:

```json
{
  "user": {
    "id": "user-123",
    "nome": "Usuário",
    "username": "usuario@ambientar.com"
  },
  "claims": [
    {
      "claimType": "modulo.cadastros",
      "claimValue": "acessar"
    },
    {
      "claimType": "Recurso.Usuario",
      "claimValue": "Visualizar"
    },
    {
      "claimType": "recurso.usuario",
      "claimValue": "criar"
    }
  ],
  "accessTokenExpiresAt": 1783814400000,
  "refreshTokenExpiresAt": 1783900800000
}
```

`Recurso.Usuario` e `recurso.usuario` representam o mesmo `claimType`. Da mesma forma, `Visualizar` e `visualizar` representam o mesmo `claimValue`.

Enquanto a API ainda retornar o formato agrupado legado `{ type, values[] }`, um adaptador exclusivo da borda HTTP o converterá para pares. Nenhuma camada interna, persistência, rota, menu ou componente utilizará o formato legado.

---

## 4. Snapshot persistido e snapshot de execução

O registro persistido será:

```ts
export type PersistedAuthSnapshot = AuthSessionData & {
  requiresRelogin: boolean;
  lockedReason: AuthLockedReason;
  pendingLocation: string | null;
};
```

O snapshot de execução será:

```ts
export type AuthStatus =
  | "unknown"
  | "authenticated"
  | "refreshing"
  | "locked"
  | "anonymous";

export type AuthSnapshot = {
  status: AuthStatus;
  user: AuthUser | null;
  claims: readonly AuthClaim[];
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
  requiresRelogin: boolean;
  hasKnownUser: boolean;
  canUseApp: boolean;
  isRefreshing: boolean;
  isLocked: boolean;
  lockedReason: AuthLockedReason;
  pendingLocation: string | null;
  revision: number;
};
```

O `revision` será incrementado somente quando o snapshot for substituído. Ele poderá ser usado por hooks e memos que precisam reagir a mudanças de sessão ou claims.

O `localStorage` é a persistência durável da interface. Após a hidratação, o snapshot em memória é usado para todas as leituras durante a execução da aplicação.

Chave versionada:

```ts
const AUTH_STORAGE_KEY = "ambientar.auth.session.v2";
```

---

## 5. Cache de autorização em memória

As claims persistidas como lista serão convertidas para um índice em memória:

```ts
export type ClaimIndex = ReadonlyMap<
  string,
  ReadonlySet<string>
>;
```

Normalização central:

```ts
export function normalizeClaimPart(
  value: string,
): string {
  return value.trim().toLowerCase();
}
```

Construção:

```ts
export function createClaimIndex(
  claims: readonly AuthClaim[],
): ClaimIndex {
  const index = new Map<string, Set<string>>();

  for (const claim of claims) {
    const claimType = normalizeClaimPart(
      claim.claimType,
    );

    const claimValue = normalizeClaimPart(
      claim.claimValue,
    );

    let values = index.get(claimType);

    if (!values) {
      values = new Set<string>();
      index.set(claimType, values);
    }

    values.add(claimValue);
  }

  return index;
}
```

Cache sem subscriptions:

```ts
export class AuthorizationCache {
  private claimIndex: ClaimIndex =
    EMPTY_CLAIM_INDEX;

  replace(claims: readonly AuthClaim[]): void {
    this.claimIndex = createClaimIndex(claims);
  }

  clear(): void {
    this.claimIndex = EMPTY_CLAIM_INDEX;
  }

  has(requirement: ClaimRequirement): boolean {
    const claimType = normalizeClaimPart(
      requirement.claimType,
    );

    const claimValue = normalizeClaimPart(
      requirement.claimValue,
    );

    return (
      this.claimIndex
        .get(claimType)
        ?.has(claimValue) ?? false
    );
  }
}
```

O cache:

* não usa React;
* não possui listeners;
* não acessa `localStorage` durante consultas;
* não dispara renderização;
* é substituído atomicamente quando a sessão muda;
* é limpo no logout e na troca de usuário.

Complexidade:

```text
Construção: O(total de claims)
Consulta: O(1) médio
```

---

## 6. Store e atomicidade

A store será responsável por sincronizar, nesta ordem:

1. snapshot persistido;
2. snapshot de execução em memória;
3. cache de autorização;
4. notificação única aos consumidores reativos.

Exemplo conceitual:

```ts
setAuthenticated(session: AuthSessionData): void {
  const persisted: PersistedAuthSnapshot = {
    ...session,
    requiresRelogin: false,
    lockedReason: null,
  };

  saveKnownSession(persisted);
  authorizationCache.replace(session.claims);

  this.setSnapshot({
    status: "authenticated",
    user: session.user,
    claims: session.claims,
    accessTokenExpiresAt:
      session.accessTokenExpiresAt,
    refreshTokenExpiresAt:
      session.refreshTokenExpiresAt,
    requiresRelogin: false,
    hasKnownUser: true,
    canUseApp: true,
    isRefreshing: false,
    isLocked: false,
    lockedReason: null,
    pendingLocation: null,
    revision: this.snapshot.revision + 1,
  });

  this.scheduleAccessExpiration(
    session.accessTokenExpiresAt,
  );
}
```

Não poderá existir estado intermediário com usuário novo e claims antigas.

O cache poderá conservar as claims durante o estado `locked` apenas para reconstrução visual do shell. O `AuthorizationService` deverá retornar `false` enquanto `canUseApp` for `false`, de modo que claims em cache não autorizem ações durante o bloqueio.

---

## 7. Fluxo completo de inicialização e F5

```text
Aplicação iniciou
       ↓
Ler e validar snapshot persistido
       ↓
Não existe ou está corrompido?
  sim → limpar persistência e cache
      → status anonymous
      → redirecionar para login
  não ↓
requiresRelogin é true?
  sim → restaurar usuário conhecido
      → status locked
      → exibir modal de reautenticação
  não ↓
accessTokenExpiresAt <= agora?
  sim → persistir requiresRelogin = true
      → status locked
      → exibir modal de reautenticação
  não ↓
restaurar snapshot e ClaimIndex em memória
       ↓
status authenticated
       ↓
agendar expiração pelo tempo restante
       ↓
abrir a aplicação sem chamar /auth/session
```

O F5 não fará chamada obrigatória à API quando o snapshot local for válido e não estiver bloqueado.

Limitação assumida: se o servidor revogar antecipadamente um token cujo horário local ainda está válido, o frontend descobrirá no primeiro request protegido que retornar `401`.

---

## 8. Expiração, inatividade e retomada do computador

O comportamento atual de “inatividade” corresponde à expiração do access token. Não haverá monitoramento de mouse ou teclado, salvo requisito futuro específico.

A store agendará um timer para `accessTokenExpiresAt`. Quando o timer vencer:

```text
authenticated
  → persistir requiresRelogin = true
  → status locked
  → canUseApp = false
  → exibir modal
```

Para cobrir suspensão do computador e throttling de timers, a validade também será verificada em:

* `window.focus`;
* `document.visibilitychange`, quando retornar para `visible`;
* entrada em rota autenticada;
* antes de uma operação protegida, quando aplicável.

Se `Date.now()` for maior ou igual a `accessTokenExpiresAt`, a sessão será bloqueada sem tentativa automática de liberar a aplicação.

---

## 9. Refresh automático em respostas 401

Um request protegido que retornar `401` seguirá:

```text
401 recebido
   ↓
request já foi repetido ou não admite refresh?
  sim → bloquear sessão
  não ↓
iniciar uma única promise de refresh
   ↓
refresh válido?
  sim → substituir integralmente sessão e claims
      → persistir requiresRelogin = false
      → repetir request original uma vez
  não → persistir requiresRelogin = true
      → status locked
      → exibir modal
```

Requests concorrentes compartilharão a mesma promise de refresh.

Não haverá loop de refresh. Endpoints de login, refresh, relogin, logout e recuperação de senha usarão `skipAuthRefresh`.

---

## 10. Modal de reautenticação

O modal será exibido quando:

* o access token expirar;
* o computador retomar após a expiração;
* o refresh falhar;
* uma sessão bloqueada for restaurada após F5;
* o backend rejeitar a sessão e não for possível renová-la;
* ocorrer bloqueio manual.

O modal mostrará o usuário conhecido e solicitará somente a senha.

Reautenticação:

```ts
POST /auth/relogin
{
  username,
  password
}
```

Sucesso:

* substitui usuário;
* substitui todas as claims;
* reconstrói o índice;
* substitui as expirações;
* grava `requiresRelogin: false`;
* restaura `authenticated`;
* navega para `pendingLocation` ou `/app`.

Falha:

* mantém `locked`;
* mantém `requiresRelogin: true`;
* mantém o modal aberto;
* não autoriza rotas nem ações.

“Trocar usuário” limpa persistência, snapshot em memória, cache de autorização e localização pendente antes de navegar para o login.

---

## 11. Serviço central de autorização

```ts
export type AuthorizationService = {
  hasClaim(
    claimType: string,
    claimValue: string,
  ): boolean;

  satisfies(
    requirement?: ClaimRequirement,
  ): boolean;
};
```

Implementação conceitual:

```ts
export function createAuthorizationService(
  getAuthSnapshot: () => AuthSnapshot,
  cache: AuthorizationCache,
): AuthorizationService {
  return {
    hasClaim(claimType, claimValue) {
      if (!getAuthSnapshot().canUseApp) {
        return false;
      }

      return cache.has({
        claimType,
        claimValue,
      });
    },

    satisfies(requirement) {
      if (!requirement) {
        return true;
      }

      if (!getAuthSnapshot().canUseApp) {
        return false;
      }

      return cache.has(requirement);
    },
  };
}
```

O serviço não terá subscriptions e não produzirá renders. Ele apenas consulta snapshot e cache atuais em memória.

---

## 12. Reatividade da interface

Consultas imperativas como `authorization.hasClaim()` não notificam consumidores.

Componentes que precisam reagir à mudança de sessão usarão a store:

```ts
export function useAuthSnapshot() {
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );
}
```

`useClaim` reagirá somente a substituições do snapshot:

```ts
export function useClaim(
  requirement: ClaimRequirement,
): boolean {
  const snapshot = useAuthSnapshot();

  if (!snapshot.canUseApp) {
    return false;
  }

  return authorizationService.satisfies(
    requirement,
  );
}
```

Uma leitura do cache não gera render. Login, refresh, reautenticação, bloqueio, logout ou troca de usuário geram no máximo uma notificação de store por transição concluída.

---

## 13. Router e ordem dos guards

Contexto:

```ts
export type AppRouterContext = {
  auth: AuthRouterContext;
  authorization: AuthorizationService;
};
```

Ordem de uma rota protegida:

```text
ensureSession
  ↓
anonymous? → login
  ↓
refreshing? → aguardar resolução
  ↓
locked? → salvar pendingLocation e abrir rota de bloqueio
  ↓
claim válida?
  ↓
beforeLoad específico
  ↓
loader
  ↓
component
```

O shell autenticado poderá ser montado para exibir o modal, mas loaders e componentes da funcionalidade solicitada não poderão executar enquanto a sessão estiver `locked`.

Será criada uma rota interna sem claim, por exemplo `/app/sessao-bloqueada`, cuja única função será manter o shell montado enquanto o modal controla a reautenticação.

A rota `/app/acesso-negado`:

* exige sessão autenticada;
* não exige claim;
* não redireciona para si mesma;
* não entra em loop.

Para preservar a inferência do TanStack Router, será preferido um `createAuthGuard(requirement)` usado no `beforeLoad` nativo, evitando espalhar `as never`.

---

## 14. Declaração direta de claims

Não haverá catálogo de constantes de claims.

Rota:

```ts
const usersListRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "/",
  beforeLoad: createAuthGuard({
    claimType: "recurso.usuario",
    claimValue: "visualizar",
  }),
  component: UsersListPage,
});
```

Menu:

```ts
{
  id: "usuarios-listar",
  label: "Consultar usuários",
  to: "/app/cadastros/usuarios",
  claim: {
    claimType: "recurso.usuario",
    claimValue: "visualizar",
  },
}
```

Ação:

```tsx
<ClaimGuard
  claim={{
    claimType: "recurso.usuario",
    claimValue: "criar",
  }}
>
  <Button>Novo usuário</Button>
</ClaimGuard>
```

Strings repetidas são uma decisão consciente. O frontend aplica literalmente o requisito declarado em cada ponto.

---

## 15. Árvore e cumulatividade

As claims dos ancestrais são cumulativas.

```text
Cadastros: modulo.cadastros + acessar
└── Usuários: recurso.usuario + visualizar
    └── Cadastrar: recurso.usuario + criar
```

Para ver “Cadastrar”, o usuário precisa satisfazer os requisitos configurados no caminho completo:

```text
modulo.cadastros:acessar
AND recurso.usuario:visualizar
AND recurso.usuario:criar
```

Se o usuário possuir `criar`, mas não `visualizar`, o grupo configurado com `visualizar` será removido. O frontend não promoverá, inferirá ou corrigirá claims.

---

## 16. Navegação recursiva

```ts
export type NavigationItem = {
  id: string;
  label: string;
  to?: string;
  order?: number;
  claim?: ClaimRequirement;
  children?: readonly NavigationItem[];
};
```

O filtro e o componente visual serão recursivos para qualquer profundidade.

Regras:

* item sem claim própria herda somente os requisitos dos ancestrais;
* item com claim inválida é removido com toda a sua subárvore;
* filhos são avaliados individualmente;
* grupo sem filhos visíveis é removido;
* ordenação é estável;
* o menu é recalculado quando `revision` mudar;
* componentes visuais básicos não acessam autenticação ou store.

---

## 17. Módulos e registro estático único

Cada módulo exportará uma árvore raiz já contendo seus filhos:

```ts
export type AppModule<
  TRoute extends AnyRoute = AnyRoute,
> = {
  id: string;
  order?: number;
  routeTree: TRoute;
  navigation?: readonly NavigationItem[];
};
```

Exemplo:

```ts
export const cadastrosRouteTree =
  cadastrosRoute.addChildren([
    usersRoute.addChildren([
      usersListRoute,
      userCreateRoute,
    ]),
    customersRoute.addChildren([
      customersListRoute,
      customerCreateRoute,
    ]),
  ]);

export const cadastrosModule = {
  id: "cadastros",
  order: 20,
  routeTree: cadastrosRouteTree,
  navigation: [cadastrosNavigation],
} satisfies AppModule;
```

Registro único:

```ts
export const appModules = defineAppModules(
  homeModule,
  cadastrosModule,
  financeiroModule,
);
```

Serão derivados desse registro:

```ts
export const appModuleRoutes =
  getModuleRouteTrees(appModules);

export const appNavigation =
  getModuleNavigation(appModules);
```

Os helpers deverão preservar a tupla de tipos do TanStack Router. Se for necessário um cast por limitação de inferência, ele ficará isolado dentro do helper, nunca espalhado pelas rotas.

Adicionar um módulo ao registro adicionará sua árvore de rotas e sua navegação.

---

## 18. Migração temporária das rotas legadas

Enquanto existir uma rota wildcard, haverá um registro temporário:

```ts
export type LegacyRouteRequirement = {
  path: string;
  claim: ClaimRequirement;
};
```

Exemplo:

```ts
export const legacyRouteClaims = [
  {
    path: "/users",
    claim: {
      claimType: "recurso.usuario",
      claimValue: "visualizar",
    },
  },
] satisfies readonly LegacyRouteRequirement[];
```

Cada rota migrada para um módulo deverá ser removida desse registro. O registro legado é uma ponte de migração e não fará parte da arquitetura final.

---

## 19. Logout, troca de usuário e múltiplas abas

Logout e troca de usuário limparão imediatamente:

* snapshot persistido;
* snapshot em memória;
* cache de autorização;
* timer de expiração;
* localização pendente.

A chamada remota de logout não atrasará a limpeza local.

Será observado o evento `storage` para sincronizar abas:

* logout em outra aba limpa a aba atual;
* login ou troca de sessão em outra aba reconstrói snapshot e cache;
* sessão bloqueada em outra aba pode bloquear a aba atual;
* cada evento válido produz uma única transição na store.

---

## 20. Validação defensiva

Uma claim será válida somente quando:

* for um objeto;
* `claimType` for string não vazia após `trim`;
* `claimValue` for string não vazia após `trim`.

Sessão inválida não poderá reaproveitar usuário ou claims de uma resposta parcial.

Login, refresh e relogin sempre substituirão integralmente as claims. Claims novas não serão mescladas com as anteriores.

Claims repetidas, inclusive com diferenças de caixa, serão eliminadas naturalmente pelo índice normalizado.

---

# Etapas de execução e critérios

## Etapa 1 — Confirmar o contrato da API

### Entregas

* confirmar nomes `claimType` e `claimValue`;
* confirmar formato de login, refresh, relogin e metadata de sessão;
* confirmar que refresh e relogin retornam a lista completa de claims;
* confirmar cookies `HttpOnly`, `Secure` e política `SameSite` apropriada;
* confirmar semântica de expiração e bloqueio.

### Critérios de conclusão

* exemplos reais dos quatro endpoints documentados;
* ausência de dependência em `role`, `profile` ou `userType` para autorização;
* lista de claims sempre completa em login, refresh e relogin;
* API confirma que continuará validando autorização no servidor.

## Etapa 2 — Criar contratos e validadores

### Entregas

* `claim.types.ts`;
* tipos de sessão persistida e de execução;
* `isAuthClaim`;
* `isAuthSessionData`;
* `extractAuthSessionData`.

### Critérios de conclusão

* aceita claim válida;
* rejeita type ou value vazio;
* aceita diferentes caixas;
* rejeita sessão parcial;
* aceita `id` no formato confirmado pela API;
* testes de payload completo e metadata aprovados.

## Etapa 3 — Implementar persistência versionada

### Entregas

* repository de `localStorage`;
* chave `ambientar.auth.session.v2`;
* validação na leitura;
* `requiresRelogin` e `lockedReason` persistidos;
* migração ou descarte seguro da versão anterior.

### Critérios de conclusão

* snapshot válido é recuperado;
* snapshot corrompido é removido;
* nenhum token é salvo no `localStorage`;
* sessão bloqueada continua bloqueada após F5;
* localização pendente continua disponível após F5 no modal;
* logout remove completamente a persistência.

## Etapa 4 — Implementar cache em memória

### Entregas

* normalizador;
* `ClaimIndex`;
* `AuthorizationCache`;
* índice vazio compartilhado.

### Critérios de conclusão

* consultas não acessam `localStorage`;
* consultas não notificam listeners;
* consulta é case-insensitive;
* duplicidades são removidas;
* substituição não mantém claims anteriores;
* limpeza resulta em todas as consultas retornando `false`.

## Etapa 5 — Tornar a store atômica

### Entregas

* snapshot em memória;
* sincronização persistência/cache/store;
* revisão de sessão;
* métodos de autenticar, atualizar, bloquear e limpar.

### Critérios de conclusão

* nunca existe usuário novo com claims antigas;
* login gera uma única notificação;
* refresh gera uma única notificação;
* bloqueio gera uma única notificação;
* logout limpa tudo antes da resposta remota;
* leituras não geram render.

## Etapa 6 — Implementar F5 e recuperação

### Entregas

* hidratação local;
* restauração autenticada sem `/auth/session` quando válida;
* restauração bloqueada quando expirada ou marcada;
* agendamento do tempo restante.

### Critérios de conclusão

* F5 com token válido não chama API;
* F5 com token válido restaura claims;
* F5 com token expirado abre modal;
* F5 após refresh malsucedido abre modal;
* ausência de sessão vai ao login;
* persistência inválida vai ao login.

## Etapa 7 — Implementar expiração e retomada

### Entregas

* timer de expiração;
* verificação por foco;
* verificação por visibilidade;
* verificação ao entrar em rota autenticada.

### Critérios de conclusão

* expiração com aplicação aberta bloqueia;
* retorno após suspensão bloqueia;
* bloqueio persiste `requiresRelogin`;
* timer anterior é cancelado ao atualizar a sessão;
* timers não sobrevivem ao logout.

## Etapa 8 — Implementar refresh concorrente

### Entregas

* interceptor de `401`;
* promise única de refresh;
* retry único;
* atualização integral de sessão e claims;
* bloqueio em falha.

### Critérios de conclusão

* requests concorrentes fazem um refresh;
* refresh válido repete cada request no máximo uma vez;
* refresh substitui claims;
* refresh inválido abre modal;
* não existe loop de refresh;
* endpoints de autenticação não disparam refresh automático.

## Etapa 9 — Implementar reautenticação

### Entregas

* modal;
* endpoint `relogin`;
* localização pendente;
* troca de usuário.

### Critérios de conclusão

* modal não fecha por backdrop ou Escape;
* senha correta substitui toda a sessão;
* senha incorreta mantém o bloqueio;
* sucesso retorna para a localização pendente;
* troca de usuário limpa claims antes de navegar;
* F5 durante o modal mantém o modal.

## Etapa 10 — Implementar serviço e hooks

### Entregas

* `AuthorizationService`;
* `useClaim`;
* `ClaimGuard`;
* integração com `revision`.

### Critérios de conclusão

* serviço consulta somente memória;
* serviço não produz render;
* serviço retorna `false` quando a aplicação está bloqueada;
* hook reage à troca de claims;
* guard renderiza children ou fallback;
* componentes visuais básicos continuam independentes da autenticação.

## Etapa 11 — Implementar guards do router

### Entregas

* contexto de autorização;
* `createAuthGuard`;
* rota de sessão bloqueada;
* rota de acesso negado;
* proteção de loaders.

### Critérios de conclusão

* rota sem claim aceita autenticado;
* rota com claim válida abre;
* rota com claim inválida bloqueia;
* `beforeLoad` específico não executa sem claim;
* loader não executa durante bloqueio;
* pai e filho são cumulativos;
* acesso negado não entra em loop;
* localização original é preservada.

## Etapa 12 — Implementar árvore modular estática

### Entregas

* `AppModule` genérico;
* `defineAppModules`;
* extração tipada das árvores;
* registro único;
* navegação derivada.

### Critérios de conclusão

* módulo é registrado uma vez;
* adicionar módulo adiciona rota e navegação;
* filhos são montados dentro da árvore do módulo;
* tipos de rotas continuam inferidos;
* casts ficam isolados em helper, se necessários;
* ordem dos módulos é preservada.

## Etapa 13 — Implementar navegação recursiva

### Entregas

* `NavigationItem`;
* filtro recursivo;
* componente recursivo;
* claims inline.

### Critérios de conclusão

* item autorizado aparece;
* item não autorizado desaparece;
* claim do pai elimina toda a subárvore;
* grupo vazio desaparece;
* qualquer profundidade é renderizada;
* menu reage a refresh e relogin;
* `criar` não implica `visualizar`.

## Etapa 14 — Migrar rotas legadas

### Entregas

* tabela temporária path/claim;
* substituição das regras baseadas em role;
* migração módulo por módulo;
* remoção progressiva do wildcard.

### Critérios de conclusão

* toda rota legada protegida possui requisito explícito;
* URL direta é bloqueada;
* não há fallback administrativo implícito;
* rota migrada é removida da tabela temporária;
* wildcard é removido ao final da migração.

## Etapa 15 — Remover autorização antiga

### Entregas

* remoção de `permissions.ts` baseado em role;
* remoção de `route-access.ts` baseado em role;
* remoção de `roles` da navegação;
* substituição de dashboards e ações baseados em role.

### Critérios de conclusão

* nenhuma decisão de autorização usa `role`;
* não existe `isAdmin` ou bypass equivalente;
* identidade não carrega atributo usado como autorização;
* dashboard e atalhos usam claims ou configuração não autorizativa explícita;
* busca global não encontra regras antigas em código ativo.

## Etapa 16 — Sincronizar múltiplas abas

### Entregas

* listener de `storage`;
* reconstrução atômica do cache;
* propagação de logout e bloqueio.

### Critérios de conclusão

* logout em uma aba encerra as demais;
* atualização de claims em uma aba atualiza as demais;
* bloqueio não restaura claims antigas;
* eventos inválidos são ignorados;
* listener é removido no teardown.

## Etapa 17 — Validação final

### Entregas

* suíte completa;
* build;
* lint do escopo alterado;
* matriz de rotas e claims;
* relatório de migração.

### Critérios de conclusão

* todos os testes de autenticação e autorização passam;
* build de produção passa;
* não há erros de TypeScript no escopo;
* toda rota protegida está na matriz;
* API e frontend usam os mesmos pares de claim;
* nenhuma claim anterior sobrevive a logout ou troca de usuário;
* F5, suspensão, refresh, bloqueio e relogin foram validados ponta a ponta.

---

# Critérios globais de aceite

A implementação será concluída quando:

1. a autorização não depender de role, perfil ou tipo de usuário;
2. toda claim usar `claimType` e `claimValue`;
3. comparação de claims for case-insensitive;
4. consultas usarem somente o cache em memória;
5. consultas não causarem renderização;
6. mudanças de sessão atualizarem persistência, snapshot e cache atomicamente;
7. F5 com sessão válida não exigir chamada de sessão;
8. F5 com sessão expirada ou bloqueada exibir o modal;
9. suspensão do computador for detectada ao retomar;
10. refresh substituir integralmente as claims;
11. refresh inválido persistir o bloqueio;
12. reautenticação substituir integralmente a sessão;
13. logout e troca de usuário limparem claims imediatamente;
14. rotas, menus e ações declararem claims diretamente;
15. requisitos de pais e filhos forem cumulativos;
16. o frontend não inferir relações entre claims;
17. a árvore modular tiver registro estático único;
18. loaders não executarem com sessão bloqueada;
19. acesso direto por URL for protegido;
20. a API validar todas as autorizações no servidor.

---

# Fluxo consolidado

```text
login / refresh / relogin
        ↓
AuthSessionData
        ↓
persistência local versionada
        ↓
snapshot em memória + AuthorizationCache
        ↓
normalização case-insensitive
        ↓
Map<claimType, Set<claimValue>>
        ↓
AuthorizationService
        ↓
router + navegação + ações
        ↓
permitir, ocultar, bloquear ou solicitar reautenticação
```
