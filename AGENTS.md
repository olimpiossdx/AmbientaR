# AmbientaR - Guia de Desenvolvimento

## Instruções para Cursor / Agentes

### Visão geral

AmbientaR (EcoGestão MG) é uma aplicação Next.js (PWA) de gestão ambiental para pequenas consultorias em Minas Gerais. A interface é em português. Backend: Firebase (Auth, Firestore, Storage), config em `src/firebase/config.ts`.

### Executando a aplicação

- **Dev:** `npm run dev` — porta **9002** (0.0.0.0)
- **Build:** `npm run build` — erros de TypeScript/ESLint são ignorados no build (`next.config.mjs`)
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Genkit (IA):** `npm run genkit:dev` (opcional; requer `GOOGLE_GENAI_API_KEY`)
- **Publicar regras Firestore:** `npm run deploy:rules` — faz deploy apenas das regras (exige `firebase.json` na raiz com `firestore.rules` apontando para o arquivo de regras)

### Observações

- **Firebase em nuvem.** Não há emuladores. É necessário usuário Firebase válido para acessar as páginas autenticadas.
- **Next.js 14.** O projeto usa Next 14.2.x com React 18.3.1 (overrides no `package.json`).
- **PWA:** Em desenvolvimento o service worker pode estar desativado; ícone 404 no manifest é conhecido e não afeta uso.
- **GOOGLE_GENAI_API_KEY** é opcional; sem ela, fluxos de IA não funcionam mas o restante do app sim.
- **Regras Firestore:** Dois arquivos de regras existem: `src/firestore.rules` (espelho do repositório de referência) e `src/firebase/rules/firestore.rules` (usado pelo deploy se configurado no `firebase.json`). Admin tem acesso total via regra catch-all; condicionantes permitem list para manager, technical e client; commercialProposals/contracts têm restrições de update de status (espelho do projeto GitHub AmbientaR).
- **Componentes de estabilidade:** `SuppressExtensionErrors` no layout (evita overlay de erros de extensões); `(app)/loading.tsx` para feedback ao navegar.
- **Deploy:** `.firebaserc` e `firebase.json` na raiz; `npm run deploy:rules` publica as regras.
