# Por que o servidor não carrega (localhost:9002)

O **Node.js não está instalado** no seu PC. O PATH tem `F:\Projects\nodejs\`, mas essa pasta não existe (só existe `F:\Projects\cursor`). Sem Node, o comando `npm run dev` não roda e nada escuta na porta 9002.

---

## Opção 1 – Instalar Node pelo site (recomendado)

1. Abra: **https://nodejs.org**
2. Baixe a versão **LTS** (botão verde).
3. Rode o instalador e avance (Next) mantendo as opções padrão.
4. **Importante:** deixe marcada a opção **"Add to PATH"**.
5. Conclua e **reinicie o Cursor** (ou feche e abra o terminal).
6. No PowerShell ou CMD:
   ```powershell
   cd "f:\servidor\onedrive\projects\ambientar"
   npm install
   npm run dev
   ```
7. Acesse no navegador: **http://localhost:9002**

---

## Opção 2 – Instalar pelo Chocolatey (como Administrador)

Se preferir usar o Chocolatey, é preciso **abrir o PowerShell como Administrador** e resolver o lock:

1. **Abrir PowerShell como Administrador**
   - Tecla Windows → digite `PowerShell`
   - Clique com o botão direito em **Windows PowerShell** → **Executar como administrador**

2. **Remover o lock e instalar o Node:**
   ```powershell
   Remove-Item "C:\ProgramData\chocolatey\lib\4989c1eb4c31e4327959b23b04fb3c13f8dce4cf" -Force -ErrorAction SilentlyContinue
   choco install nodejs-lts -y
   ```

3. **Fechar o PowerShell de admin** e abrir um terminal normal (ou o Cursor de novo). Depois:
   ```powershell
   cd "f:\servidor\onedrive\projects\ambientar"
   npm install
   npm run dev
   ```

4. Acesse: **http://localhost:9002**

---

## Depois que o Node estiver instalado

Sempre que quiser subir o servidor local:

```powershell
cd "f:\servidor\onedrive\projects\ambientar"
npm run dev
```

Ou use o arquivo **`iniciar-servidor.bat`** (duplo clique) na mesma pasta.

**Não feche a janela do terminal** enquanto quiser usar o site em localhost:9002.
