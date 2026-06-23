# Credenciais Firebase Admin (desenvolvimento local)

O servidor Next.js usa a **conta de serviço** do Firebase para ações de administrador (ex.: **Liberar e-mail bloqueado** em Usuários).

## 1. Descarregar o JSON

1. Abra [Firebase Console → Contas de serviço](https://console.firebase.google.com/project/studio-316805764-e4d13/settings/serviceaccounts/adminsdk) (projeto `studio-316805764-e4d13`).
2. **Gerar nova chave privada** e guarde o ficheiro `.json`.
3. **Não** faça commit deste ficheiro (já está no `.gitignore`).

## 2. Colocar o ficheiro nesta pasta

Caminho canónico:

```text
config/firebase-service-account.json
```

Atalho com script do projeto (a partir da raiz):

```powershell
node scripts/copy-firebase-service-account.mjs "C:\caminho\para\chave-baixada.json"
```

Pode usar `config/firebase-service-account.json.example` só como referência da estrutura (não é uma chave válida).

Notas locais opcionais (gitignored): `config/chaves-gerais.txt`

## 3. Apontar no `.env.local` (opcional)

Se o ficheiro estiver em `config/firebase-service-account.json`, o servidor **já o encontra** sem variável. Para caminho explícito:

```env
GOOGLE_APPLICATION_CREDENTIALS=D:\AmbientaR\config\firebase-service-account.json
```

Alternativa: variável `FIREBASE_SERVICE_ACCOUNT_KEY` com o JSON completo numa linha. Ver `.env.example` na raiz.

## 4. Reiniciar o dev server

```powershell
npm run dev
```

Abra `http://localhost:9002` → Usuários. O aviso de credenciais em falta deve desaparecer.

## Atalho sem configurar o PC

Apague o utilizador em [Authentication → Users](https://console.firebase.google.com/project/studio-316805764-e4d13/authentication/users) no Firebase Console.
