# PWA / casca local e Capacitor

## Objetivo

Permitir que, **em produção**, o browser (ou WebView Capacitor) guarde **HTML/JS/CSS** do Next.js em cache via **service worker** (Workbox), para:

- Navegação de volta a rotas já visitadas **com menos dependência de rede**;
- **Fallback** documento em `/offline` quando a navegação falha por rede.

## O que foi ligado no código

- [`next.config.mjs`](../next.config.mjs): `@ducanh2912/next-pwa` com `disable: process.env.NODE_ENV === "development"`, `fallbacks.document: "/offline"`, `navigateFallback` e denylist para `/api`, `/_next/data/` e `/_next/image` (evita fallback incorreto em otimização de imagens).
- [`src/app/offline/page.tsx`](../src/app/offline/page.tsx): página simples de “sem ligação”.
- [`src/components/unregister-service-worker-dev.tsx`](../src/components/unregister-service-worker-dev.tsx): continua a **remover SW só em desenvolvimento** (evita chunks antigos).

## Política de deploy / invalidação

- Cada `next build` gera novos hashes em `/_next/static/*`. O Workbox associa precache a esses assets; **novo deploy** deve levar o SW a atualizar (`skipWaiting: true` ajuda a aplicar rápido).
- **Testar sempre** após deploy: hard refresh ou “limpar dados do site” se um cliente ficar preso a SW antigo.
- **Não** cachear respostas `/api/*` como substituto de dados — APIs continuam online-only salvo fila explícita (`src/lib/offline`).

## Capacitor: `server.url` vs bundle local

| Modo | Prós | Contras |
|------|------|---------|
| **`server.url` atual** | Um URL de produção; atualizações web imediatas | **Sem rede na primeira abertura** não carrega o site |
| **Bundle estático no `webDir`** | Abre sem rede se shell estiver no APK | Exige build estático / outro pipeline; Next completo com API não cabe “só estático” |

**Recomendação:** manter `server.url` + **PWA em produção** no domínio remoto; o WebView beneficia do mesmo SW que o Chrome após primeira visita online. Para “cold start” total sem rede, avançar para **subconjunto estático** ou app nativo (ver [OFFLINE-NATIVE-CRITERIA.md](./OFFLINE-NATIVE-CRITERIA.md)).

## Validação em staging (Trilho D)

1. `NODE_ENV=production` build (`npm run build`) e servir com `npm run start` ou ambiente de homologação.
2. Abrir o site, confirmar registo do service worker (DevTools → Application → Service Workers).
3. Navegar por 2–3 rotas autenticadas, depois ativar **Offline** e voltar a essas rotas: deve servir cache ou `/offline` conforme o caso.
4. Verificar que pedidos a `/api/*` e imagens `/_next/image` **não** devolvem o HTML de `/offline` no separador Network.
5. Após novo deploy, testar atualização do SW (hard refresh se necessário).

