# Termos de Referência – Pasta e alimentação do sistema

A pasta **`termos de referencia`** na raiz do projeto reúne os TRs e modelos que você está baixando para alimentar a **Base Jurídica** (RAG) do AmbientaR.

## Estrutura da pasta (exemplo)

- **1. Modelos de estudos da Pimenta Consultoria** – modelos .dotx (PCA, PTRF, PRADA, relatórios, etc.)
- **LISTAGEM A–G** – termos por tipo de atividade (mineração, industrial, infraestrutura, resíduos, agrossilvipastoris)
- **PCA GERAL** – TR PCA geral (ex.: `TR PCA geral.pdf`)
- **PRADA** / **PTRF** – projetos específicos
- **Modelos de cabecalhos, roda pe e marca dagua** – identidade visual (pouco uso para RAG)

Arquivos relevantes para a IA: **.pdf**, **.docx**, **.dotx** (conteúdo textual). Imagens e templates visuais podem ficar na pasta sem serem importados.

## Formas de usar no sistema

### 1. Manual (já disponível)

1. Acesse **Configurações → Base Jurídica**.
2. Clique em **Nova fonte (manual)**.
3. Preencha: tipo **Termo de referência**, número/título (ex.: “TR PCA Geral”), órgão/UF se souber.
4. Salve e, na página da fonte, use **Adicionar trechos (manual)**.
5. Abra cada PDF ou Word na pasta `termos de referencia`, copie o texto e cole no diálogo; confirme **Inserir trechos no RAG**.

Vantagem: controle total. Desvantagem: um arquivo por vez.

### 2. Script de importação em lote (recomendado quando houver muitos arquivos)

Foi criado um script Node que:

- Lê a pasta `termos de referencia` (ou outro caminho que você indicar).
- Localiza todos os **.pdf**, **.docx** e **.dotx**.
- Extrai o texto (mammoth para Word, pdf-parse para PDF).
- Cria uma **fonte** em `knowledge_sources` por arquivo (tipo `termo_referencia`, título a partir do nome do arquivo/pasta).
- Gera os **trechos** em `rag_index` (quebras por parágrafo, mínimo ~50 caracteres).

Assim você pode baixar os TRs aos poucos, colocar na pasta e rodar o script quando quiser atualizar a base.

Instruções: ver **Script de importação** abaixo.

### 3. Pipeline futuro (robô)

Quando existir o pipeline (robô que sugere fontes a partir de PDFs/links), as mesmas coleções (`knowledge_sources` + `rag_index`) serão usadas, com `modoInclusao: 'robo_sugeriu'` e fluxo de aprovação. A pasta local continua sendo uma fonte legítima para alimentação manual ou via script.

---

## Script de importação

- **Pasta do script:** `scripts/import-termos-referencia/`
- **Uso:** ver `scripts/import-termos-referencia/README.md` e executar com Node (ex.: `node index.js` ou `npm run import:tr`).

Requisitos:

- **Node** com suporte a ES modules ou CommonJS (conforme o script).
- **Firebase:** conta de serviço (service account) com permissão de escrita em Firestore, em arquivo JSON.
- Variável de ambiente **`GOOGLE_APPLICATION_CREDENTIALS`** apontando para esse JSON.
- Opcional: **`TERMOS_REFERENCIA_DIR`** com o caminho da pasta (padrão: `termos de referencia` na raiz do projeto).

O script não altera arquivos na pasta; apenas lê, extrai texto e grava no Firestore.

---

## Resumo

| Forma              | Quando usar                         |
|--------------------|-------------------------------------|
| Manual (app)       | Poucos arquivos; revisar trecho a trecho. |
| Script em lote     | Muitos PDFs/Word; atualizar a base de uma vez. |
| Pipeline (futuro)  | Sugestões automáticas; aprovação depois. |

A pasta **`D:\AmbientaR\termos de referencia`** serve tanto para você organizar os TRs baixados quanto como entrada para o script; pode ir alimentando aos poucos e rodar o script quando quiser refletir na Base Jurídica.
