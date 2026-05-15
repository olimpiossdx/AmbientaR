# Credenciais Firebase Admin (desenvolvimento local)

O servidor Next.js usa a **conta de serviço** do Firebase para ações de administrador (ex.: **Liberar e-mail bloqueado** em Usuários).

## 1. Descarregar o JSON

1. Abra [Firebase Console → Contas de serviço](https://console.firebase.google.com/project/studio-316805764-e4d13/settings/serviceaccounts/adminsdk) (projeto `studio-316805764-e4d13`).
2. **Gerar nova chave privada** e guarde o ficheiro `.json`.
3. **Não** faça commit deste ficheiro (já está no `.gitignore`).

## 2. Colocar o ficheiro nesta pasta

Copie o JSON para:

```text
E:\A\config\firebase-service-account.json
```

Se já tiver o JSON noutro sítio (ex. `E:\AmbientaR\config\...`), copie com o Explorador de Ficheiros ou no PowerShell:

```powershell
Copy-Item "C:\caminho\para\o-seu.json" "E:\A\config\firebase-service-account.json"
```

Pode usar `config\firebase-service-account.json.example` só como referência da estrutura (não é uma chave válida).

## 3. Apontar no `.env.local`

Na raiz do projeto (`E:\A`), edite `.env.local` e adicione **uma** linha (caminho absoluto no Windows):

```env
GOOGLE_APPLICATION_CREDENTIALS=E:\A\config\firebase-service-account.json
```

Alternativa: variável `FIREBASE_SERVICE_ACCOUNT_KEY` com o JSON completo numa linha (útil em hosting). Ver `.env.example` na raiz.

## 4. Reiniciar o dev server

Pare o `npm run dev` com **Ctrl+C** e volte a executar:

```powershell
cd E:\A
npm run dev
```

Abra de novo `http://localhost:9002` → Usuários. O aviso de credenciais em falta deve desaparecer.

## Atalho sem configurar o PC

Apague o utilizador em [Authentication → Users](https://console.firebase.google.com/project/studio-316805764-e4d13/authentication/users) no Firebase Console.
