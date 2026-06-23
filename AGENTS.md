# AmbientaR - Guia de Desenvolvimento

## Instruções para Cursor / Agentes

### Visão geral

AmbientaR (EcoGestão MG) é uma aplicação Next.js (PWA) de gestão ambiental para pequenas consultorias em Minas Gerais. A interface é em português. Backend: Firebase (Auth, Firestore, Storage), config em `src/firebase/config.ts`.

**Repositório:** cópia de trabalho recomendada em **`E:\AmbientaR`**; manter o **GitHub** alinhado com `git commit` + `git push` (e `git pull` noutras máquinas). Ver `docs/REPOSITORIO-LOCAL-E-GITHUB.md`.

### Executando a aplicação

- **Dev:** `npm run dev` — porta **9002** (0.0.0.0)
- **Dev (mais rápido, ideal para teste no celular):** `npm run dev:turbo` — mesma porta, compilação bem mais rápida
- **Build:** `npm run build` — erros de TypeScript/ESLint são ignorados no build (`next.config.mjs`)
- **Deploy Firebase App Hosting:** antes de push/rollout, correr `npm run apphosting:check` (lint + typecheck no build, como na nuvem). O adaptador App Hosting corre ESLint mesmo quando o build local ignora.
- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Performance / organização (check rápido):** `npm run perf:check` — `typecheck` + `audit:routes` + auditoria de imports pesados (`@turf/turf`, `run-wave-a-analysis`) em ficheiros `"use client"`. Roadmap e registo: [`docs/PERF-ROADMAP-DETALHADO.md`](docs/PERF-ROADMAP-DETALHADO.md), [`docs/PERF-AUDIT.md`](docs/PERF-AUDIT.md). Medição de bundle: `npm run build` (heap 8 GB se OOM: `NODE_OPTIONS=--max-old-space-size=8192`), `npm run analyze`, `npm run apphosting:check`. **PRs de performance:** uma fase do roadmap (F04–F18) por PR — não misturar Bloco 2 (peso browser) com Bloco 3 (FormShell) na mesma PR.
- **Coordenadas (formulários):** entrada uniforme SIRGAS 2000 / UTM 23S / GMS — lib `src/lib/coordinates/`, componentes `src/components/coordinates/`. Ver `docs/COORDENADAS-SIRGAS2000.md`. Verificação: `npm run coordinates:check` (verify + audit; `prebuild` de `npm run build`).
- **Genkit (IA):** `npm run genkit:dev` (opcional; requer `GOOGLE_GENAI_API_KEY`)
- **Publicar regras Firestore:** `npm run deploy:rules` — faz deploy apenas das regras (`firebase.json` → `src/firebase/rules/firestore.rules`)

### Observações

- **Firebase em nuvem.** Não há emuladores. É necessário usuário Firebase válido para acessar as páginas autenticadas.
- **Next.js 14.** O projeto usa Next 14.2.35 (patch atual da linha 14) com React 18.3.1 (overrides no `package.json`).
- **PWA:** Em **desenvolvimento** o service worker do PWA (`@ducanh2912/next-pwa`) fica **desativado**; `UnregisterServiceWorkerDev` remove SW antigos para evitar ChunkLoadError. Em **produção** (`npm run build`) gera-se `public/sw.js` (ver `.gitignore`). Estratégia offline-first: `src/lib/offline/`, `OfflineProvider` em `(app)/layout`, documentação em `docs/OFFLINE-*.md`.
- **IA (roteamento):** consultas leves → **Gemini** (`GOOGLE_GENAI_API_KEY`); relatórios e tarefas pesadas → **DeepSeek** (`DEEPSEEK_API_KEY`). **Sem OpenAI** — não usa `OPENAI_API_KEY` nem debita ChatGPT Business/Codex. Ver `docs/IA-ROTEAMENTO.md`. Sem chaves, fluxos de IA falham; o restante do app funciona.
- **Firebase Admin (APIs no servidor, ex. liberar e-mail bloqueado):** em `npm run dev` local é preciso credencial de conta de serviço. No `.env.local`, use **uma** opção: `GOOGLE_APPLICATION_CREDENTIALS=E:\caminho\service-account.json` (caminho absoluto no Windows) **ou** `FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}` (JSON numa linha). Alternativa: ficheiro `config/firebase-service-account.json` (gitignored). Obtenha o JSON em Firebase Console → Definições do projeto → Contas de serviço → Gerar nova chave privada. Em **Firebase App Hosting** / Cloud Run o ADC do GCP costuma bastar (sem variáveis). Ver também `.env.example`.
- **Pasta local de referências para IA (import / RAG):** legado — `ENABLE_AI_LOCAL_IMPORT=true` + `import-reference-files` (omissão: 503). **Preferir biblioteca OneDrive:** `ONEDRIVE_RAG_ENABLED=true`, `ONEDRIVE_LIBRARY_ROOT_PATH`, APIs `/api/cloud-rag/*`, UI **AI Lab → Biblioteca IA (OneDrive)**. Ver `docs/CLOUD-RAG-ONEDRIVE.md` e `src/lib/reference-search` (nuvem com fallback local).
- **Firestore / rede em produção:** erros QUIC, DNS ou IndexedDB no browser — `docs/APP-HOSTING-VARIAVEIS.md` (secção Firestore no browser).
- **Regras Firestore:** ficheiro único para deploy: `src/firebase/rules/firestore.rules` (definido no `firebase.json`). Admin tem acesso total via regra catch-all; commercialProposals/contracts têm restrições de update de status (espelho do projeto GitHub AmbientaR). *Não* uses ficheiros espelho extra — evita divergência entre GitHub e o que se publica com `npm run deploy:rules`.
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
