# Como rodar o servidor local (AmbientaR)

O app é um **Next.js** e sobe na porta **9002**.

## O que está faltando no seu PC

- **Node.js** não está instalado (ou não está no PATH).
- A pasta **node_modules** não existe no projeto — as dependências nunca foram instaladas.

Enquanto isso não for feito, o `localhost:9002` não vai funcionar.

---

## Passo a passo

### 1. Instalar Node.js

1. Acesse: **https://nodejs.org**
2. Baixe a versão **LTS**.
3. Execute o instalador e siga as opções padrão (incluindo “Add to PATH”).
4. **Feche e abra de novo** o Cursor (ou qualquer terminal) para o PATH ser atualizado.

### 2. Abrir o terminal na pasta do projeto

- No Cursor: **Ctrl+`** (ou menu **Terminal → New Terminal**).
- No terminal, vá para a pasta do projeto:
  ```powershell
  cd c:\Users\Andrew\Documents\AmbientaR
  ```

### 3. Instalar dependências

```powershell
npm install
```

Espere terminar (pode levar alguns minutos). Será criada a pasta `node_modules`.

### 4. Subir o servidor

```powershell
npm run dev
```

Quando aparecer algo como:

```text
▲ Next.js 15.x.x
- Local: http://localhost:9002
```

**não feche esse terminal.**

### 5. Abrir no navegador

Acesse: **http://localhost:9002**

---

## Se der erro

- **"npm não é reconhecido"** → Node.js não está no PATH. Reinstale o Node e reinicie o Cursor/terminal.
- **"EADDRINUSE" ou porta em uso** → Outro programa está usando a 9002. Feche-o ou altere a porta no `package.json` (script `dev`: `-p 9003` em vez de `-p 9002`).
- **Erro ao rodar `npm install`** → Copie a mensagem de erro completa do terminal e use para pedir ajuda (por exemplo no chat).

---

## Resumo dos comandos

```powershell
cd c:\Users\Andrew\Documents\AmbientaR
npm install
npm run dev
```

Depois acesse **http://localhost:9002** no navegador.
