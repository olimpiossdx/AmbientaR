# Decisão: Capacitor `server.url` vs bootstrap estático vs app nativo (Trilho E)

## Estado atual

- **Capacitor** com `server.url` apontando para o site em produção (HTTPS): atualizações web imediatas; **primeira abertura sem rede** não carrega o shell Next sem cache PWA prévio.
- **PWA** em build de produção (`next.config.mjs`): melhora cache de assets; ver [`OFFLINE-PWA-SHELL.md`](./OFFLINE-PWA-SHELL.md).

## Opções (quando formalizar requisito)

| Opção | Quando escolher |
|-------|-----------------|
| **Manter só `server.url` + PWA** | Aceitar que o utilizador abra **uma vez online** após instalar; menor custo. |
| **Bootstrap estático no `webDir`** | Exigir ícone na loja que abre **sempre** sem rede (HTML mínimo + redirect ou shell SPA separado). Implica pipeline de build extra. |
| **App nativo (React Native + DB local)** | Campo com fotos/GPS/dias offline; ver [`OFFLINE-NATIVE-CRITERIA.md`](./OFFLINE-NATIVE-CRITERIA.md). |

## Critério de gatilho

Só avançar para bootstrap estático ou nativo quando houver **requisito escrito** (produto/legal) e estimativa de custo; até lá, iterar em **web + PWA + `src/lib/offline/`**.
