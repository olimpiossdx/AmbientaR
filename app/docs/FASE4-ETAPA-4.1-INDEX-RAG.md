# Fase 4 – Etapa 4.1: Pipeline para popular `rag_index` (detalhe)

Este documento explica **como o passo 4.1 funciona**, **como será usado** no dia a dia e **o que já existe** para implementar agora.

---

## 1. O que é o passo 4.1

Hoje o índice RAG (`rag_index`) é alimentado de duas formas:

- **Manual:** na tela de detalhe da fonte (`/knowledge-sources/[id]`), o usuário clica em “Adicionar trechos (manual)”, cola o texto e o sistema quebra em parágrafos e grava em `rag_index`.
- **Script em lote:** `scripts/import-termos-referencia` lê uma pasta local (ex.: `termos de referencia`), cria **novas** fontes em `knowledge_sources` e os trechos em `rag_index`.

O **passo 4.1** acrescenta uma terceira forma:

- **Indexação a partir de um arquivo (PDF/DOCX)** já associado a uma fonte existente: uma API (ou job) lê o arquivo, extrai o texto, quebra em trechos e grava em `rag_index` para aquela fonte. O usuário dispara isso por um botão **“Indexar para RAG”** na tela do detalhe da fonte.

Ou seja: **uma fonte que tenha um arquivo (PDF/DOCX) passa a poder ser indexada automaticamente**, sem colar texto à mão e sem rodar o script em lote.

---

## 2. Fluxo passo a passo (como vai ser usado)

### 2.1 Onde o arquivo fica

Cada fonte em `knowledge_sources` pode ter o campo **`storagePath`** (caminho do arquivo no **Firebase Storage**). Exemplo: `knowledge_sources/abc123/norma.pdf`.

- **Cenário A – Com upload no app (recomendado):**  
  Na tela do detalhe da fonte, o usuário faz **upload** de um PDF ou DOCX. O app envia o arquivo para o Firebase Storage, grava o caminho em `storagePath` e mostra o botão **“Indexar para RAG”**.

- **Cenário B – Sem upload (só API):**  
  O usuário sobe o arquivo manualmente no Storage (pelo console do Firebase ou outro meio) e preenche/edita a fonte no app com o mesmo `storagePath`. Depois clica **“Indexar para RAG”**.

Para **implementar agora**, o desenho é: a API de indexação **só usa arquivo que já está no Firebase Storage** (campo `storagePath`). Se `storagePath` estiver vazio, a API responde com erro orientando o usuário a fazer upload ou a usar “Adicionar trechos (manual)”. O upload na tela pode ser feito na mesma etapa ou logo em seguida.

### 2.2 Quem dispara a indexação

- **Botão “Indexar para RAG”** na página de detalhe da fonte (`/knowledge-sources/[id]`).  
  Esse botão chama a API `POST /api/knowledge-sources/[id]/index-rag` (com o `id` da fonte).

- **Depois (passo 4.2):** o botão **“Aprovar”** na listagem da Base Jurídica também poderá chamar essa mesma API, para que ao aprovar uma sugestão do robô a indexação rode automaticamente.

### 2.3 O que a API faz (visão geral)

1. **Recebe** o `id` da fonte (pela URL da rota).
2. **Lê** o documento da fonte em `knowledge_sources` no Firestore (para pegar `storagePath`, `tipo`, `uf`, `orgao`, `numero`, `titulo`).
3. **Valida:** se não houver `storagePath`, retorna 400 com mensagem do tipo “Fonte sem arquivo. Faça upload do PDF/DOCX ou use Adicionar trechos (manual).”
4. **Baixa** o arquivo do Firebase Storage (usando o path em `storagePath`).
5. **Extrai** o texto do arquivo:
   - **PDF:** biblioteca tipo `pdf-parse` (ou equivalente em Node).
   - **DOCX/DOTX:** biblioteca tipo `mammoth` (extração de texto).
6. **Quebra** o texto em trechos (chunks):
   - Por parágrafos (blocos separados por linha em branco), como no script atual.
   - Trechos com menos de ~50 caracteres são ignorados.
7. **Remove** os trechos antigos dessa fonte em `rag_index` (para não duplicar ao reindexar).
8. **Grava** um documento em `rag_index` para cada trecho, com:
   - `sourceId` = id da fonte
   - `tipoDocumento`, `uf`, `orgao`, `numero`, `titulo` (copiados da fonte)
   - `chunkText` = texto do trecho
   - `chunkIndex` = ordem
   - `referencias` = {} (ou metadados extras, se quiser depois).
9. **Responde** com sucesso (ex.: `{ success: true, chunksCount: 42 }`).

A tela, ao receber sucesso, pode mostrar um toast “X trechos indexados” e recarregar a lista de trechos (que já vem da coleção `rag_index` com `sourceId == id`).

### 2.4 Quem usa o resultado

- O **Assistente IA** e a **geração de blocos no DOCX** (passos 4.3) usam `queryRagChunks`, que lê da coleção `rag_index`.  
- Depois do passo 4.2, `queryRagChunks` só considerará trechos de fontes com `aprovado === true`.  
- Ou seja: **indexar (4.1) é o passo que “enche” o RAG**; aprovar e filtrar vêm no 4.2; usar no DOCX no 4.3.

---

## 3. O que já existe no projeto (para reusar)

- **Estrutura de dados:** `KnowledgeSource` (com `storagePath`) e `RagIndexEntry` em `src/lib/types.ts`.  
- **Telas:** listagem e detalhe da fonte em `/knowledge-sources` e `/knowledge-sources/[id]`, com “Adicionar trechos (manual)” e listagem de trechos por `sourceId`.  
- **Lógica de extração e chunk:** no script `scripts/import-termos-referencia/index.js`:
  - `extractText(filePath)` – DOCX/DOTX com `mammoth`, PDF com `pdf-parse`.
  - `chunkText(text)` – split por `\n\s*\n`, trim, filtro de tamanho mínimo (50 caracteres).  
- **Firestore:** regras e coleções `knowledge_sources` e `rag_index` já usadas pelo app.  
- **Storage:** Firebase Storage já é usado no projeto; falta apenas a API usar o Admin SDK para baixar por `storagePath`.

Ou seja: **já dá para implementar a API e o botão “Indexar para RAG”** reutilizando a lógica do script (extração + chunk) e passando a ler o arquivo do Storage em vez da pasta local. A única decisão já tomada para “implementar agora” é: **arquivo vem do Firebase Storage** quando `storagePath` estiver preenchido.

---

## 4. Podemos implementar agora?

**Sim.** Com o desenho acima:

- **Implementar agora:**  
  - API `POST /api/knowledge-sources/[id]/index-rag`: ler fonte, validar `storagePath`, baixar do Storage, extrair texto (pdf-parse + mammoth), chunkar, apagar trechos antigos da fonte, gravar novos em `rag_index`.  
  - Botão **“Indexar para RAG”** na tela `/knowledge-sources/[id]` (visível quando `source.storagePath` existir), chamando essa API.

- **Opcional na mesma leva ou em seguida:**  
  - Upload de PDF/DOCX na tela do detalhe da fonte, salvando no Storage e preenchendo `storagePath`, para que o usuário não precise subir o arquivo pelo console do Firebase.

- **Fora do escopo do 4.1:**  
  - Leitura de pasta local no servidor (ex.: `termos de referencia`) continua no script atual; a API não precisa ler disco além do arquivo baixado do Storage.

Resumo: o passo 4.1 está fechado em termos de desenho e dependências; podemos trabalhar na implementação agora usando **Storage + API + botão “Indexar para RAG”**.
