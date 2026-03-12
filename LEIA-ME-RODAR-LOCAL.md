# Como rodar o AmbientaR localmente

O projeto **só funciona com Node.js instalado**. Siga um dos caminhos abaixo.

---

## Opção 1 — Instalar Node.js (recomendado)

1. Acesse **https://nodejs.org** e baixe a versão **LTS**.
2. Execute o instalador e marque **"Add to PATH"**.
3. **Feche e abra de novo** o Cursor (ou qualquer terminal).
4. No terminal:
   ```powershell
   cd "f:\servidor\onedrive\projects\ambientar"
   npm install
   npm run dev
   ```
5. Abra no navegador: **http://localhost:9002**

---

## Opção 2 — Usar o script automático

1. No Explorador de Arquivos, vá até:
   ```
   f:\servidor\onedrive\projects\ambientar
   ```
2. Dê **duplo clique** em **`iniciar-servidor.bat`**.
3. Se aparecer **"Node.js não encontrado"**, instale o Node (Opção 1) e tente de novo.
4. Quando aparecer **"Ready on http://0.0.0.0:9002"**, abra no celular ou no PC: **http://localhost:9002**

---

## Opção 3 — PowerShell como Administrador (Chocolatey)

Se você usa Chocolatey e quer instalar o Node por ele:

1. Abra o **PowerShell como Administrador**.
2. Remova o lock (se tiver dado erro antes) e instale:
   ```powershell
   Remove-Item "C:\ProgramData\chocolatey\lib\4989c1eb4c31e4327959b23b04fb3c13f8dce4cf" -Force -ErrorAction SilentlyContinue
   choco install nodejs-lts -y
   ```
3. Feche o PowerShell de admin, abra um terminal normal e rode:
   ```powershell
   cd "f:\servidor\onedrive\projects\ambientar"
   npm install
   npm run dev
   ```

---

## Testar no celular (mesma rede)

Com o servidor rodando no PC (`npm run dev`):

1. Descubra o IP do seu PC (no PowerShell: `ipconfig` → procure "IPv4" da rede Wi‑Fi).
2. No celular, conectado na **mesma rede Wi‑Fi**, abra no navegador:
   ```
   http://SEU_IP:9002
   ```
   Exemplo: `http://192.168.1.10:9002`

O projeto já está configurado para rodar em `0.0.0.0:9002`, então aceita acesso pela rede local.

---

## Resumo

| Situação | O que fazer |
|----------|-------------|
| Node não instalado | Instalar em https://nodejs.org (LTS) e reiniciar o terminal. |
| Depois de instalar o Node | `cd` na pasta do projeto → `npm install` → `npm run dev`. |
| Atalho rápido | Duplo clique em `iniciar-servidor.bat` (se o Node estiver no PATH). |
| Acessar no celular | Use o IP do PC na mesma rede: `http://IP:9002`. |

**Não feche a janela do terminal** enquanto quiser usar o site. Para parar o servidor, feche a janela ou use `Ctrl+C`.

---

## Erro "expected layout router to be mounted"

Esse erro costuma aparecer quando o app é aberto **no navegador embutido do Cursor** (Simple Browser / Preview). O App Router do Next.js pode falhar nesse contexto.

**Solução:** abra o AmbientaR em um **navegador externo** (Chrome, Edge ou Firefox) em **http://localhost:9002**. Não use a aba de preview do Cursor. O projeto foi atualizado para Next.js 15.1.0; rode `npm install` e reinicie o servidor (`npm run dev`).

---

## Aviso do SWC no Windows

Se aparecer no terminal algo como *"Attempted to load @next/swc-win32-x64-msvc... não é um aplicativo Win32 válido"*: é só um aviso. O Next.js continua rodando e o site abre normalmente em http://localhost:9002. Pode ignorar.
