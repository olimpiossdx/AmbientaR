# Importar Termos de Referência para a Base Jurídica

Este script lê a pasta **termos de referencia** (ou outra que você indicar), extrai texto de cada arquivo **.pdf**, **.docx** e **.dotx**, e grava no Firestore:

- **knowledge_sources**: uma fonte por arquivo (tipo `termo_referencia`, título a partir do nome do arquivo/pasta).
- **rag_index**: trechos por parágrafo (separados por linha em branco; mínimo ~50 caracteres por trecho).

## Pré-requisitos

1. **Node.js** instalado (v18+).
2. **Conta de serviço Firebase** com permissão de escrita no Firestore:
   - No console do Firebase: Projeto → Configurações do projeto → Contas de serviço → Gerar nova chave privada.
   - Salve o JSON em um local seguro (ex.: `config/firebase-service-account.json`) e **não** faça commit desse arquivo.

## Uso

### 1. Instalar dependências (só na primeira vez)

```bash
cd scripts/import-termos-referencia
npm install
```

### 2. Testar sem gravar (dry run)

Lista os arquivos que seriam importados, sem escrever no Firestore:

```bash
set GOOGLE_APPLICATION_CREDENTIALS=
set DRY_RUN=true
npm start
```

No PowerShell:

```powershell
$env:DRY_RUN="true"
npm start
```

### 3. Importar de fato

Defina o caminho do JSON da conta de serviço e execute:

**Windows (cmd):**

```cmd
set GOOGLE_APPLICATION_CREDENTIALS=D:\AmbientaR\config\firebase-service-account.json
npm start
```

**PowerShell:**

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="D:\AmbientaR\config\firebase-service-account.json"
npm start
```

**Linux/macOS:**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/firebase-service-account.json"
npm start
```

### 4. Usar outra pasta

Por padrão o script usa a pasta `termos de referencia` na raiz do projeto. Para outra pasta:

**PowerShell:**

```powershell
$env:TERMOS_REFERENCIA_DIR="D:\AmbientaR\termos de referencia"
npm start
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho absoluto para o JSON da conta de serviço Firebase (obrigatório para gravar). |
| `TERMOS_REFERENCIA_DIR` | Pasta com os PDF/DOCX/DOTX (padrão: `termos de referencia` na raiz do projeto). |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase (padrão: `studio-316805764-e4d13`). |
| `DRY_RUN` | Se `true` ou `1`, só lista arquivos e não grava no Firestore. |

## Observações

- O script **não remove** fontes nem trechos já existentes; cada execução **adiciona** novas fontes (uma por arquivo). Se rodar duas vezes na mesma pasta, haverá duplicidade. Para evitar, mova ou renomeie os arquivos já importados, ou limpe manualmente no Firestore.
- Encoding dos nomes de arquivo: em alguns sistemas os nomes com acentos podem aparecer estranhos no log; o conteúdo extraído costuma estar correto.
- PDFs só imagem (não pesquisáveis) não geram texto; o script ignora e segue para o próximo.

Depois de importar, as fontes aparecem em **Configurações → Base Jurídica** e são usadas pelo **Assistente IA** (RAG).
