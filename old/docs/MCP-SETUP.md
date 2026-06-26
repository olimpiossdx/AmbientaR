# Setup MCP (Firebase) - AmbientaR

Este guia prepara o ambiente para o Cursor usar MCP com Firebase no projeto AmbientaR.

## 1) Pre-requisitos

- Node.js e npm funcionando.
- Acesso ao projeto Firebase do AmbientaR.
- Arquivo de credencial de service account (`serviceAccountKey.json`).

## 2) Gerar credencial Firebase

1. Abra o Firebase Console.
2. Projeto `studio-316805764-e4d13` -> Configuracoes do projeto -> Service Accounts.
3. Clique em **Generate new private key**.
4. Salve o JSON em caminho seguro (fora do repo, de preferencia).

## 3) Variaveis de ambiente (MCP)

Use como base o arquivo `mcp.env.example`.

Minimo necessario:

- `SERVICE_ACCOUNT_KEY_PATH` -> caminho absoluto do `serviceAccountKey.json`
- `FIREBASE_STORAGE_BUCKET` -> `studio-316805764-e4d13.appspot.com`

Exemplo no PowerShell (sessao atual):

```powershell
$env:SERVICE_ACCOUNT_KEY_PATH="C:\secrets\ambientar-serviceAccountKey.json"
$env:FIREBASE_STORAGE_BUCKET="studio-316805764-e4d13.appspot.com"
```

## 4) Subir servidor MCP (HTTP)

Na raiz do projeto:

```powershell
npm run mcp:firebase:http
```

Servidor esperado:

- `http://localhost:9000/mcp`

## 5) Configurar Cursor

O projeto ja possui:

- `.cursor/mcp.json` -> aponta para `http://localhost:9000/mcp`
- `.cursor/mcp.json.example` -> modelo de referencia

Se precisar, ajuste a URL no `.cursor/mcp.json`.

## 6) Teste rapido

Com MCP rodando, no Cursor teste uma acao simples (ex.: listar colecoes Firestore pelo MCP).

Se der erro de conexao:

- confirme o processo do script `npm run mcp:firebase:http` ativo;
- valide se a URL `http://localhost:9000/mcp` esta correta;
- confira o caminho de `SERVICE_ACCOUNT_KEY_PATH`.

## 7) Observacoes de seguranca

- Nao versionar `serviceAccountKey.json`.
- Nao compartilhar esse arquivo em chat/commit.
- Renove a chave se houver vazamento.
