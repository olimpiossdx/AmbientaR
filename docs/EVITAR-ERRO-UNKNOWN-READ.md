# Como reduzir o erro "UNKNOWN: unknown error, read"

O Next.js precisa ler muitos arquivos (incluindo em `node_modules`). Se o Windows Defender ou outro antivírus escanear esses arquivos ao mesmo tempo, a leitura falha e aparece esse erro.

---

## Excluir a pasta do projeto do Windows Defender

1. Abra **Segurança do Windows** (busque "Segurança do Windows" no menu Iniciar).
2. Vá em **Proteção contra vírus e ameaças**.
3. Em **Configurações de proteção contra vírus e ameaças**, clique em **Gerenciar configurações**.
4. Role até **Exclusões** e clique em **Adicionar ou remover exclusões**.
5. Clique em **Adicionar uma exclusão** → **Pasta**.
6. Selecione (ou digite):
   ```
   F:\servidor\onedrive\projects\ambientar
   ```
7. Confirme. Não é necessário reiniciar o PC.

Depois disso, feche o terminal onde está rodando `npm run dev`, abra de novo e rode:

```powershell
cd "F:\servidor\onedrive\projects\ambientar"
npm run dev
```

Acesse **http://localhost:9002** no Chrome ou Edge. O erro "UNKNOWN: unknown error, read" pode desaparecer ou ficar bem mais raro.

---

## Se ainda aparecer erro

- Confirme que a pasta **AmbientaR** está com **"Sempre manter neste dispositivo"** no OneDrive (botão direito na pasta → essa opção).
- Enquanto estiver desenvolvendo, **pause a sincronização** do OneDrive (ícone na bandeja do sistema).
