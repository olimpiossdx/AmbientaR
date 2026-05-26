# Firebase App Hosting — variáveis de ambiente e erros comuns em produção

Referência para a URL de **produção** (backend Next em App Hosting), não para `localhost:9002`.

## Onde configurar

1. **Repositório:** [`apphosting.yaml`](../apphosting.yaml) — variáveis versionadas (ex.: VAPID pública).
2. **Console:** Firebase → **App Hosting** → backend → **Environment variables** / Secrets — sobrescreve ou complementa o YAML; exige **novo rollout** após alteração.

Flags sensíveis estão em [`src/lib/deploy-flags.ts`](../src/lib/deploy-flags.ts).

## Variáveis de funcionalidade

| Variável | Omissão | Efeito |
|----------|---------|--------|
| `ENABLE_AI_ROUTES` | `true` | Rotas `/api/ai*` ativas (chaves Gemini/DeepSeek ainda necessárias). |
| `ENABLE_AI_LOCAL_IMPORT` | `false` | `POST /api/ai-lab/import-reference-files` responde **503** com mensagem de desativação. |
| `ENABLE_NEXT_API_ROUTES` | `false` no middleware* | Ver [`src/middleware.ts`](../src/middleware.ts). Em deploy GitHub Actions costuma vir `true`. |
| `ENABLE_LAUDO_WEBHOOK` | `false` | Webhook de laudo desligado. |

\* Valor efetivo depende do que o runtime do container recebe no rollout.

### Ativar import local de referências em produção

Só faz sentido se os ficheiros existirem **no runtime** do container (pasta no bundle da imagem, volume montado, ou path acessível pelo Node). Em dev, use `.env.local`:

```env
ENABLE_AI_LOCAL_IMPORT=true
AI_REFERENCE_FILES_PATH=E:\caminho\termos
```

No App Hosting (exemplo comentado em `apphosting.yaml`):

```yaml
  - variable: ENABLE_AI_LOCAL_IMPORT
    value: "true"
    availability:
      - RUNTIME
```

Sem `true`, a UI que chama `/api/ai-lab/import-reference-files` verá **503** — comportamento esperado, não falha de Firestore.

## Push FCM (PWA / celular)

| Variável | Onde | Efeito se ausente/incorreta |
|----------|------|-----------------------------|
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | [`apphosting.yaml`](../apphosting.yaml) (BUILD + RUNTIME) ou consola App Hosting | Push com app fechado **não regista** token; sem erro visível na UI (sino Firestore continua). |

Checklist no projeto Firebase `studio-316805764-e4d13`:

1. **Cloud Messaging** → **Web Push certificates** → par VAPID (chave **pública** na variável acima).
2. **Google Cloud Console** → APIs → **Firebase Cloud Messaging API** ativada.
3. Service worker [`public/firebase-messaging-sw.js`](../public/firebase-messaging-sw.js) na **mesma versão** do SDK (`firebase` no `package.json`, hoje 12.x).
4. Credencial **Admin** no runtime para envio server-side — ver [`docs/NOTIFICACOES-PUSH.md`](./NOTIFICACOES-PUSH.md).

Erro `fcmregistrations.googleapis.com` **401** / `messaging/token-subscribe-failed` em produção: quase sempre VAPID errada, API FCM desativada ou rollout antigo sem a variável.

## Branding (imagens no Storage)

URLs `firebasestorage.googleapis.com` / `*.firebasestorage.app` **não** devem ser carregadas direto no browser (CORS). A app usa proxy same-origin [`/api/branding/image`](../src/app/api/branding/image/route.ts) — ver [`src/lib/storage-image-proxy-client.ts`](../src/lib/storage-image-proxy-client.ts).

Se no DevTools ainda aparecer CORS em `branding/...png`, confirme que o deploy inclui essas alterações e faça *hard refresh* (Ctrl+F5).

## Firestore no browser (produção)

Erros no DevTools como `ERR_QUIC_PROTOCOL_ERROR`, `ERR_HTTP2_PING_FAILED`, `ERR_NAME_NOT_RESOLVED` em `firestore.googleapis.com` indicam **rede ou transporte** entre o utilizador e o Google, não regras Firestore no projeto `studio-316805764-e4d13`.

### Cache persistente (IndexedDB)

Em produção, [`src/firebase/load-firebase-client.ts`](../src/firebase/load-firebase-client.ts) usa `persistentLocalCache` + `persistentMultipleTabManager`. Se o browser bloquear armazenamento:

- Mensagem: **Tracking Prevention blocked access to storage**
- Erro: `IndexedDbTransactionError` / `Internal error opening backing store`

**Ações no cliente (URL de produção):**

1. Exceção de rastreamento / cookies para o **domínio exato** da app (Edge, Safari, extensões de privacidade).
2. DevTools → Application → **Clear site data** → recarregar.
3. Evitar várias abas da mesma app (cada aba mantém sincronização Firestore).
4. Rede estável; desativar VPN; opcionalmente desativar QUIC experimental no Chrome/Edge se `QUIC_TOO_MANY_RTOS` persistir.

O SDK reconecta quando a rede volta; avisos `WebChannelConnection ... transport errored` são efeito colateral.

### Chat (widget)

O widget de chat usa um único `onSnapshot` na coleção `chats` (não recria o listener quando as contagens de não lidas mudam). Falhas pontuais em `getDocs` de mensagens não lidas podem aparecer como aviso de regras ou por indisponibilidade temporária do IndexedDB/rede.

## Pré-deploy

```bash
npm run apphosting:check
```

Ver também [`docs/OFFLINE-CONEXAO-CHECKLIST.md`](./OFFLINE-CONEXAO-CHECKLIST.md) e [`docs/NOTIFICACOES-PUSH.md`](./NOTIFICACOES-PUSH.md).
