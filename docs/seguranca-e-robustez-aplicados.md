# AmbientaR – Repasse: o que foi sugerido e o que foi aplicado

Documento de referência do que foi sugerido para deixar o software mais **seguro** e **robusto** e o que **já está aplicado** no projeto.

---

## 1. Segurança – Regras Firestore

### Aplicado
- **Funções de role** em `src/firebase/rules/firestore.rules`: `isSignedIn`, `isAdmin`, `isManager`, `isClient`, `isFinancial`, `isSales`, `isTechnical`, `getUserProfile`.
- **Regra global:** `match /{document=**} { allow read, write: if isAdmin(); }` – admin com acesso total.
- **condicionantes:** list para isManager() || isTechnical() || isClient(); write para isManager() || isTechnical().
- **commercialProposals / contracts:** update com restrição de status (Accepted/Rejected e Aprovado só admin/financial).
- **Script:** `npm run deploy:rules`; guia em **docs/firebase-deploy-rules.md**.

---

## 2. Navegabilidade e UX

- **`src/app/(app)/loading.tsx`** – loading da rota principal; exibido ao navegar no menu.

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

## 5. Resumo

| Área            | O que está aplicado |
|-----------------|----------------------|
| Firestore rules | Catch-all admin; isTechnical; condicionantes; restrições de update em proposals/contracts |
| UX              | loading.tsx na rota (app); supressão de erros de extensão |
| Deploy          | firebase.json, .firebaserc, npm run deploy:rules, firebase-tools |

Este documento pode ser atualizado quando novas melhorias forem aplicadas.
