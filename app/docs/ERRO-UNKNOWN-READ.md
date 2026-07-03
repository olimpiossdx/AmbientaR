# Erro "UNKNOWN: unknown error, read" no Next.js

Esse erro acontece quando o Next.js (Webpack) tenta ler arquivos do projeto e o Windows/OneDrive falha na leitura. É comum com o projeto dentro de **OneDrive** ou em caminhos muito longos ou com caixa mista (ex.: `F:\SERVIDOR\OneDrive` vs `F:\servidor\onedrive`).

---

## Solução 1 — Usar Turbopack (tentar primeiro)

O Turbopack usa outra forma de ler os arquivos e pode evitar o erro mesmo na pasta atual:

```powershell
cd "f:\servidor\onedrive\projects\ambientar"
npm run dev:turbo
```

Depois acesse **http://localhost:9002** no Chrome ou Edge.

---

## Solução 2 — Mover o projeto para fora do OneDrive (recomendado)

1. **Pare o servidor** (Ctrl+C no terminal).
2. **Copie** a pasta inteira do projeto para um caminho simples, por exemplo:
   - `C:\dev\ambientar`
   - ou `F:\dev\ambientar` (desde que **não** seja dentro de OneDrive).
3. **Abra** essa nova pasta no Cursor (File → Open Folder).
4. No terminal:
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   npm install
   npm run dev
   ```
5. Acesse **http://localhost:9002** no navegador.

Assim o Next.js deixa de ler arquivos dentro do OneDrive e o erro "UNKNOWN: unknown error, read" tende a sumir.

---

## Se ainda der 500 ou erro de build

- Exclua a pasta do projeto do **antivírus** em tempo real (ex.: Windows Defender → exclusões).
- Feche o **OneDrive** temporariamente ou pausar sincronia da pasta do projeto.
- Use sempre o **mesmo caminho** (só minúsculas, ex.: `f:\dev\ambientar`) para abrir o projeto e rodar os comandos.
