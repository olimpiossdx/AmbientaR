# Notificações — sino e push no celular (PWA)

## O que o cliente recebe

1. **Sino** (barra superior): alertas em `users/{uid}/notifications`.
2. **Alerta na tela** (app aberto): notificação do navegador via Service Worker.
3. **Push FCM** (app fechado / PWA instalado): requer chave VAPID configurada.

## Eventos que geram alerta

| Origem | Quando |
|--------|--------|
| Multas e Defesas | Nova multa; prazos 5/3/1/0 dias |
| Condicionantes | Nova/atualização; vencimento próximo |
| Licenças, outorgas, DAIA | Novo cadastro; validade próxima |
| CAR, fauna, uso insignificante | Novo documento |
| Financeiro | Proposta, fatura, contrato |
| Ofícios | Ofício concluído (destinatário pelo nome) |
| Vistoria | Relatório aprovado |
| Cadastro incompleto | Titular com `cadastroIncompleto` (empreendedor) — sincronizado na sessão |
| Pedido de acesso | Representante/consultor solicita vínculo; titular aprova/rejeita |
| Convite portal | Admin cria acesso Cliente Gestão |
| Convite delegado | Titular indica representante/consultor |

Destinatários: titular do empreendedor/cliente + representantes (`approvedUserIds`) + consultores (`approvedConsultorIds`).

**Badge no ícone (PWA):** contagem de não lidas via Badging API (`navigator.setAppBadge`), quando o browser suportar.

## Configurar push FCM (obrigatório para celular com app fechado)

1. [Firebase Console](https://console.firebase.google.com/) → projeto `studio-316805764-e4d13` → **Build** → **Cloud Messaging**.
2. Aba **Web Push certificates** → **Generate key pair** (VAPID).
3. **Google Cloud Console** (mesmo projeto) → **APIs e serviços** → ativar **Firebase Cloud Messaging API**.
4. Copie a **chave pública** para `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=Bxxxxxxxx...
```

5. Reinicie o dev server: `npm run dev`.
6. No telemóvel: abra o site → instale **Adicionar à tela inicial** → aceite **Notificações** quando o browser pedir.

## Publicar regras Firestore

As regras permitem o utilizador guardar `fcmTokens` no próprio perfil:

```bash
npm run deploy:rules
```

(Requer `firebase login` e projeto correto em `.firebaserc`.)

## Credenciais Admin (APIs de push)

Em desenvolvimento local, configure no `.env.local` uma opção de `docs/firebase-deploy-rules.md` / `AGENTS.md`:

- `GOOGLE_APPLICATION_CREDENTIALS=...service-account.json`, ou
- `FIREBASE_SERVICE_ACCOUNT_KEY={...}`

Sem Admin, o sino funciona; o envio FCM pela API pode falhar silenciosamente (aviso no console).

## Teste no celular (rede local)

1. No PC: `npm run dev` (reinicie após alterar `.env.local`).
2. No celular (mesma Wi-Fi): `http://IP_DO_PC:9002` — veja o IPv4 com `ipconfig` (não use `0.0.0.0`).
3. Login como **cliente** → aceite **Notificações** quando o browser pedir.
4. **Adicionar à tela inicial** (PWA) — recomendado para push com app fechado.
5. No PC, login **admin** → Multas e Defesas → **Nova multa** para o empreendedor desse cliente.
6. No celular: sino com aviso novo; com permissão, alerta na barra do telemóvel.

Em dev, abra a consola do browser no celular (Chrome remoto) ou no PC se testar no desktop: deve aparecer `[FCM] Token registado no perfil.`

## Produção (App Hosting)

A chave VAPID está em `apphosting.yaml`. Após `git push`, o próximo rollout usa-a no build. Pode também definir a mesma variável na consola Firebase → App Hosting → ambiente → Secrets/variáveis (sobrescreve o ficheiro).

O ficheiro `public/firebase-messaging-sw.js` deve usar a **mesma versão** do SDK Firebase que `package.json` (ex.: 12.13.0). Versões diferentes entre SW e app causam falha ao subscrever token (401 na consola).

Detalhes de variáveis e erros: [`docs/APP-HOSTING-VARIAVEIS.md`](./APP-HOSTING-VARIAVEIS.md).

## Teste rápido (desktop)

1. Login como **admin** → Multas e Defesas → **Nova multa** para um empreendedor com cliente vinculado.
2. Login como **cliente** desse empreendedor → sino deve mostrar 1 não lida.
3. Com permissão de notificação ativa → alerta nativo ao chegar o aviso.

## Ficheiros técnicos

- `src/lib/cadastro-incompleto-alerts.ts` — aviso de empreendedor incompleto
- `src/lib/app-badge.ts` — badge no ícone PWA
- `src/lib/notification-admin-server.ts` — notificações server-side (convite portal)
- `src/components/notification-push-provider.tsx` — escuta e prazos
- `src/lib/client-deadline-alerts.ts` — prazos automáticos
- `public/firebase-messaging-sw.js` — background push
- `src/app/api/notifications/register-fcm/route.ts`
- `src/app/api/notifications/send-push/route.ts`
