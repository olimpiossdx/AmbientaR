# AmbientaR - Guia de Desenvolvimento

## Instruções para Cursor / Agentes

### Visão geral

AmbientaR (EcoGestão MG) é uma aplicação Next.js (PWA) de gestão ambiental para pequenas consultorias em Minas Gerais. A interface é em português. Backend: Firebase (Auth, Firestore, Storage), config em `src/firebase/config.ts`.

### Executando a aplicação

- **Dev:** `npm run dev` — porta **9002** (0.0.0.0)
- **Dev (mais rápido, ideal para teste no celular):** `npm run dev:turbo` — mesma porta, compilação bem mais rápida
- **Build:** `npm run build` — erros de TypeScript/ESLint são ignorados no build (`next.config.mjs`)
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Genkit (IA):** `npm run genkit:dev` (opcional; requer `GOOGLE_GENAI_API_KEY`)
- **Publicar regras Firestore:** `npm run deploy:rules` — faz deploy apenas das regras (exige `firebase.json` na raiz com `firestore.rules` apontando para o arquivo de regras)

### Observações

- **Firebase em nuvem.** Não há emuladores. É necessário usuário Firebase válido para acessar as páginas autenticadas.
- **Next.js 14.** O projeto usa Next 14.2.35 (patch atual da linha 14) com React 18.3.1 (overrides no `package.json`).
- **PWA:** Em desenvolvimento o service worker pode estar desativado; ícone 404 no manifest é conhecido e não afeta uso.
- **GOOGLE_GENAI_API_KEY** é opcional; sem ela, fluxos de IA não funcionam mas o restante do app sim.
- **Regras Firestore:** Dois arquivos de regras existem: `src/firestore.rules` (espelho do repositório de referência) e `src/firebase/rules/firestore.rules` (usado pelo deploy se configurado no `firebase.json`). Admin tem acesso total via regra catch-all; condicionantes permitem list para manager, technical e client; commercialProposals/contracts têm restrições de update de status (espelho do projeto GitHub AmbientaR).
- **Componentes de estabilidade:** `SuppressExtensionErrors` no layout (evita overlay de erros de extensões); `(app)/loading.tsx` para feedback ao navegar.
- **Deploy:** `.firebaserc` e `firebase.json` na raiz; `npm run deploy:rules` publica as regras.
- **Alerta de aprovação de representantes:** o perfil cliente (titular) vê em Configurações → Usuários o card "Aprovar acesso de representantes". Para os pedidos pendentes carregarem, as regras do Firestore precisam estar publicadas (a coleção `access_requests` permite read para usuário autenticado). Se aparecer "Não foi possível carregar os pedidos de acesso", o administrador deve executar `npm run deploy:rules` (e estar logado: `firebase login`).

### Acesso pelo celular na rede local

- **No celular use o IP do PC**, não `0.0.0.0`. Ex.: `http://192.168.1.105:9002` (veja o IPv4 com `ipconfig` no Wi-Fi).
- O dev já escuta em `0.0.0.0:9002` (`npm run dev`).

Se não carregar ou der timeout:

1. **Firewall:** duplo clique em `scripts\LIBERAR-PORTA-9002.cmd` e aceite o UAC (Administrador). Ou: PowerShell como administrador → `.\scripts\liberar-porta-9002-firewall.ps1`.
2. **HTTP:** use `http://IP:9002`, nunca `https://` no dev.
3. Celular e PC na **mesma rede Wi-Fi** (evite rede convidada com isolamento).
4. **Primeira carga lenta:** a primeira requisição em modo dev pode levar 1–2 minutos; se der timeout, aguarde e recarregue ou use `npm run dev:turbo` no PC.
5. **Roteador:** com “isolamento de cliente”/AP Isolation ativo, desative para teste ou use outro Wi-Fi.
6. **Se ainda não abrir no celular:** use túnel — terminal 1: `npm run dev`; terminal 2: `npm run dev:tunnel`; abra no celular a URL `https://....loca.lt` que aparecer. Ver `docs/ACESSO-CELULAR-DEV.md`.
