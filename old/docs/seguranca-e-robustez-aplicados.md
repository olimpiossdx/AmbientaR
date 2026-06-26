# AmbientaR – Repasse: o que foi sugerido e o que foi aplicado

Documento de referência do que foi sugerido para deixar o software mais **seguro** e **robusto** e o que **já está aplicado** no projeto.

---

## 1. Segurança – Regras Firestore

### Aplicado
- **Funções de role** em `src/firebase/rules/firestore.rules`: `isSignedIn`, `isAdmin`, `isManager`, `isClient`, `isFinancial`, `isSales`, `isTechnical`, `getUserProfile`.
- **Regra global:** `match /{document=**} { allow read, write: if isAdmin(); }` – admin com acesso total.
- **condicionantes:** list para isManager() || isTechnical() || isClient(); write para isManager() || isTechnical().
- **commercialProposals / contracts:** update com restrição de status (Accepted/Rejected e Aprovado só admin/financial).
- **autoInfracaoDefesas:** regra dedicada com acesso administrativo para o módulo de defesa.
- **supplierContracts:** coleção e regras de escrita para `admin`, `sales`, `supervisor`, `financial`.
- **Script:** `npm run deploy:rules`; guia em **docs/firebase-deploy-rules.md**.

---

## 2. Navegabilidade e UX

- **`src/app/(app)/loading.tsx`** – loading da rota principal; exibido ao navegar no menu.
- **Sidebar desktop dinâmica**: readequação de largura ao abrir submenus para evitar corte de texto.
- **Busca unificada nos cards**: filtro em tempo real padronizado com componente reutilizável.

---

## 3. Erros de extensão (ex.: MetaMask)

- **`src/components/suppress-extension-errors.tsx`** – filtra erros de chrome-extension e MetaMask.
- Uso em **`src/app/layout.tsx`**.

---

## 4. Documentação e deploy

- **firebase.json** aponta para `src/firebase/rules/firestore.rules`.
- **.firebaserc** com projeto default para `deploy:rules`.
- **docs/COMPARACAO-GITHUB-AMBIENTAR.md** – comparação com o repositório de referência.
- **docs/firebase-deploy-rules.md** – como publicar regras e ajustar role no Firestore.

---

## 5. APIs Next.js (App Hosting)

### Fase 1 (2026-05-22)

- **`src/lib/api-auth.ts`**: `requireAuthenticatedApi` (Bearer Firebase) além de `requireAdminApiAuth`.
- **`src/lib/api-client-auth.ts`**: `getBearerApiHeaders` para chamadas do browser.
- **Rotas `/api/uploads/*`**: resposta **410** (disco local desativado; usar Firebase Storage).
- **Autenticação obrigatória** em: `geospatial/analyze`, `termos-referencia/list`, `external-embed-check`, `laudos/gerar-docx`, `ai/preencher-relatorio`.
- **`/api/package/check`**: 401 só sem token; limite de plano continua **200** com `{ ok: false }`.
- **`safe-fetch-api`**: não re tenta 401/403/404/410.

### Fase 2 (2026-05-22)

- **Disco local desativado (410)**: `/api/branding`, `/api/templates/[type]`, `/api/inventory-project-photos`.
- **Proxy Storage autenticado**: `/api/branding/image` exige Bearer; cliente em `storage-image-proxy-client.ts` (PDFs e laudos).
- **Preview de anexos**: `<img>` usa URL direta do Storage; `fetch` para PDF usa proxy com token.
- **Auth em**: `geospatial/wave-a`, `ai/enriquecer-processo`, `ai/deepseek/chat`, `studies/[slug]/form-schema`, `canais/notificar-laudo-pronto`, `package/usage`.
- **Study-maps / FCM**: `verifyBearerUid` alinhado com `verifyIdTokenAndLoadUser` (perfil Firestore).
- **Admin / AI Lab**: mantêm `requireAdminApiAuth` (sem alteração).

### Fase 3 (2026-05-22)

- **Layout `(app)`**: subscrições do perfil `client` só com `profileAligned` + `sessionUid` (UID Auth, não `user.id` legado).
- **`route-access`**: aliases para URLs legadas (`/autos-infracao-defesa`, `/environmental-company`, etc.).
- **`/autos-infracao-defesa`**: `redirect()` no servidor (sem flash de página cliente).
- **Checklist**: `docs/auditoria-menus-fase3-checklist.md` via `npm run audit:menus-by-role`.
- **`fetchApiWithAuth`**: helper para novas chamadas `/api/*`.

#### Auditoria por perfil (código)

Documento: **`docs/auditoria-perfis-interacao.md`**. Resumo das correções:

| Perfil | Correções principais |
|--------|----------------------|
| `client`, `cliente_autonomo`, `representative` | `resolvePortalAuthUid`; queries portal; `access_requests` só no titular; licenças/contratos/faturas filtrados |
| `technical`, `gestor` | Sem `access_requests` global; edição do próprio perfil em `/users` |
| `supervisor` | Botão Editar em `/users` para todos os utilizadores |
| `financial`, `sales` | `sales` pode criar propostas comerciais (UI alinhada ao Firestore) |
| `advogado`, `diretor_fauna` | Edição do próprio perfil; `diretor_fauna` em `selfServiceRoles` |
| `admin` | APIs admin com Bearer; exclusão portal com `sessionTargetUid` |

Helpers: `canEditUserInUsersList`, `getAppUserProfileUid` (`uid` antes de `id`).

### Fase 4 — Deploy e validação (operacional)

1. **Regras Firestore:** `npm run deploy:rules` (requer `firebase login`).
2. **Storage (se aplicável):** `npm run deploy:storage`.
3. **Checklist manual:** `docs/auditoria-menus-fase3-checklist.md` — um login por perfil, consola sem `permission-denied` repetido.
4. **App Hosting:** após push/rollout, comparar erros 401/410 e taxa global no console Firebase.
5. **Pré-deploy:** `npm run apphosting:check` (lint + typecheck como na nuvem).

---

## 6. Resumo

| Área            | O que está aplicado |
|-----------------|----------------------|
| Firestore rules | Catch-all admin; condicionantes; proposals/contracts; autoInfracaoDefesas; supplierContracts |
| APIs App Hosting | Uploads legados 410; APIs sensíveis com Bearer; package/check sem 401 em limite de plano |
| UX              | loading.tsx na rota (app); supressão de erros de extensão; sidebar dinâmica; busca unificada |
| Deploy          | firebase.json, .firebaserc, npm run deploy:rules, `npm run deploy:storage`, firebase-tools |

Este documento pode ser atualizado quando novas melhorias forem aplicadas.
