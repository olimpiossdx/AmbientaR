# Separacao Web/App

Esta separacao foi criada a partir da pasta `old`, mantendo `old` intacta.

## `web/`

Contem a aplicacao web Next.js e os artefatos de deploy web:

- `src/`, `public/`, `functions/`, `config/`, `scripts/`
- configs Next/Firebase/Tailwind/TypeScript
- documentacao, fixtures, relatorios e termos de referencia usados pela web
- `package.json` renomeado para `ambientar-web`

Removido da web:

- `android/`
- `ios/`
- `capacitor/`
- `capacitor.config.ts`
- scripts e dependencias `@capacitor/*` do `package.json`

## `app/`

Contem o app Capacitor independente, com uma copia propria do front necessario:

- `android/`, `ios/`, `capacitor/`, `capacitor.config.ts`
- `src/`, `public/`, configs Next/Firebase/Tailwind/TypeScript
- scripts Capacitor (`cap:sync`, `cap:sync:deploy`, `cap:open:android`, `cap:open:ios`, `cap:copy`)
- `package.json` renomeado para `ambientar-app`

## Duplicacao intencional

Como o app atual e um shell Capacitor/WebView que reutiliza o front Next.js, os arquivos de front e configuracao foram duplicados em `web/` e `app/` para permitir evolucao independente.

## Nao copiado

Artefatos gerados ou ambientes locais nao foram copiados:

- `old/venv`
- `old/logs`
- `old/output`

