# Regras do Projeto - Revisao de Arquitetura

Este documento consolida as regras persistentes do projeto AmbientaR para revisao arquitetural, com separacao por origem, impacto e pontos de verificacao.

## 1) Estado atual de acesso Firebase CLI

- Status: login confirmado no ambiente local.
- Conta autenticada: `allanbeckk@gmail.com`.
- Projeto padrao definido no repositorio: `studio-316805764-e4d13` (arquivo `.firebaserc`).

## 2) Inventario de regras encontradas

### Regra A - `AGENTS.md`

**Origem**
- Arquivo: `AGENTS.md`
- Escopo: instrucoes operacionais para desenvolvimento e execucao local.

**Diretrizes principais**
- App: Next.js PWA para gestao ambiental; interface em portugues.
- Firebase backend: Auth, Firestore, Storage; configuracao em `src/firebase/config.ts`.
- Comandos padrao:
  - `npm run dev` (porta `9002`, host `0.0.0.0`)
  - `npm run dev:turbo`
  - `npm run build`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run deploy:rules`
- Sem emuladores: ambiente local usa servicos em nuvem.
- Regras Firestore:
  - **único ficheiro de deploy:** `src/firebase/rules/firestore.rules` (via `firebase.json`); sem espelhos em `src/` ou raiz
- Observacao critica de pipeline:
  - `npm run build` aciona postbuild com `deploy:rules`.
- Rede local/celular:
  - acesso por IP da maquina (nao `0.0.0.0`)
  - porta `9002`
  - scripts de liberacao de firewall disponiveis em `scripts/`.

**Impacto arquitetural**
- Define padrao de execucao e reproducibilidade de ambiente.
- Vincula build local a operacao de deploy de regras (acoplamento CI/local).
- Estabelece Firebase cloud-first (sem emulacao), influenciando testes.
- Formaliza restricoes de acesso no Firestore e dependencia de regras publicadas.

**Riscos e atencoes**
- Build local com deploy implicito pode causar publicacao nao intencional de regras.
- Ausencia de emuladores aumenta dependencia de credenciais/ambiente cloud.
- Manter apenas `src/firebase/rules/firestore.rules` como fonte de regras evita divergência face ao deploy.

### Regra B - `.cursor/rules/ambientar-firebase-e-deploy.mdc`

**Origem**
- Arquivo: `.cursor/rules/ambientar-firebase-e-deploy.mdc`
- Tipo: regra sempre aplicada (`alwaysApply: true`).
- Escopo: separacao repo x nuvem Firebase, deploy e operacao em producao.

**Diretrizes principais**
- Repositorio local/GitHub contem codigo e `docs/`.
- Firebase nao "espelha" repositorio; recebe apenas o que for publicado.
- Projeto alvo: `studio-316805764-e4d13`.
- Regras Firestore para deploy: `src/firebase/rules/firestore.rules` via `firebase.json`.
- Fluxo local recomendado:
  - `npm install`
  - `npm run dev` / `npm run dev:turbo`
  - `npm run deploy:rules` para regras.
- Pos-Blaze: checklist de Auth/Firestore/Storage/Functions/roles.
- Producao:
  - `firebase deploy --only hosting` publica apenas estaticos de `public/`.
  - Para app Next completa: Firebase App Hosting, Vercel ou Cloud Run.
- Nota Windows (cópia em `E:\AmbientaR`):
  - usar `git config --global --add safe.directory E:/AmbientaR` em caso de `dubious ownership` (ajustar ao caminho real se for noutra unidade).

**Impacto arquitetural**
- Explicita fronteira entre codigo versionado e recursos gerenciados no Firebase.
- Define estrategia de deploy granular (regras, hosting, funcoes).
- Alinha decisao de runtime da app completa (App Hosting/Vercel/Cloud Run) com limitacoes do Hosting estatico.

**Riscos e atencoes**
- Interpretacao incorreta de `firebase deploy --only hosting` pode quebrar expectativas de SSR/API routes.
- Falta de bloco de Storage no `firebase.json` pode deixar regras de Storage fora do fluxo padrao.
- Roles de usuarios em `users/{uid}` sao precondicao funcional para autorizacoes.

## 3) Regras transversais consolidadas (para governanca)

- **Projeto Firebase canonico:** `studio-316805764-e4d13`.
- **Fonte de verdade de regras Firestore para deploy:** `src/firebase/rules/firestore.rules`.
- **Repositorio nao e ambiente:** nada em `docs/` vai ao Firebase sem deploy explicito.
- **Ambiente local com cloud real:** sem emuladores, exige autenticacao valida.
- **Acesso mobile em dev:** sempre via IP da maquina + porta `9002`.
- **Cuidado com automacao de build:** postbuild com deploy de regras.

## 4) Checklist sugerido para revisao de arquitetura

- Confirmar se o acoplamento `build -> deploy:rules` deve permanecer.
- Definir estrategia oficial de producao para Next completo (App Hosting x Vercel x Cloud Run).
- Manter uma unica fonte de regras Firestore versionada: `src/firebase/rules/firestore.rules`.
- Validar se Storage rules devem entrar no `firebase.json` e pipeline.
- Formalizar politica de roles e provisionamento de `users/{uid}`.
- Definir abordagem de testes (cloud-only atual x futura emulacao controlada).

## 5) Arquivos-fonte analisados

- `AGENTS.md`
- `.cursor/rules/ambientar-firebase-e-deploy.mdc`
