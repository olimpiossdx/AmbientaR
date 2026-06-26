# Checklist — conexão segura e estável (Trilho A)

## TLS e domínio

- [ ] Produção servida apenas em **HTTPS** (ex.: `https://www.ambientar.ia.br`).
- [ ] Firebase Console → Authentication → **Authorized domains**: incluir o host de produção (com e sem `www` se aplicável).
- [ ] Sem misturar conteúdo **HTTP** em páginas HTTPS (evita avisos e quebras de API no browser).

## Capacitor / Android

- [ ] `capacitor.config.ts`: `androidScheme: "https"` quando `server.url` está definido.
- [x] `AndroidManifest.xml`: `android:usesCleartextTraffic="false"` na `<application>` (HTTP em claro desativado) — aplicado em `android/app/src/main/AndroidManifest.xml`.
- [ ] Após alterar URL de produção: `npm run cap:sync:deploy` e novo build na loja.

## Aplicação Next

- [x] Rotas `/api/*` protegidas por middleware conforme [`src/middleware.ts`](src/middleware.ts).
- [x] Wrapper [`fetchApiWithRetry`](../src/lib/safe-fetch-api.ts) aplicado em piloto (termos de referência; geoespacial com bloqueio offline). Expandir conforme [`OFFLINE-PILOTS.md`](./OFFLINE-PILOTS.md).

## Monitorização

- [ ] Em falhas persistentes, verificar CDN, certificado SSL, e logs do hosting (Vercel / Firebase App Hosting / outro).
- [ ] Erros `firestore.googleapis.com` (QUIC, DNS, IndexedDB / Tracking Prevention) na URL de produção: [`APP-HOSTING-VARIAVEIS.md`](./APP-HOSTING-VARIAVEIS.md).

## O que este checklist não resolve sozinho

- **Offline-first completo** (fotos, filas dedicadas): ver `docs/OFFLINE-FIRST-MVP.md` e `src/lib/offline/`.
