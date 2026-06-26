# Atalhos Windows para desenvolvimento local (porta 9002)

| Ficheiro | Uso |
|----------|-----|
| `start-dev.bat` | Procura Node no PATH e corre `npm run dev` |
| `start-dev.ps1` | Igual em PowerShell |
| `iniciar-dev-9002.ps1` | Liberta porta 9002 e inicia dev |
| `diagnostico.ps1` | Gera `diagnostico-resultado.txt` na raiz |
| `instalar-node.bat` | Instala Node LTS do `%TEMP%` (legado) |
| `iniciar-servidor-portable-node.bat` | Usa `node-v*-win-x64` na raiz do projeto |

**Na raiz do projeto:** `start-dev.bat` (wrapper) ou, no terminal:

```bash
npm run dev
```

Mais detalhes: [`docs/setup/COMO-RODAR.md`](../../docs/setup/COMO-RODAR.md).
