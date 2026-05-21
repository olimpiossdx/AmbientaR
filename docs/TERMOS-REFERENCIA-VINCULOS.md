# Vínculo Termos de Referência ↔ Estudos (Estudos Técnicos)

## O que esta função faz (e o que não faz)

- **Faz:** vincula a subpasta da pasta **termos de referencia** (ex.: PRADA, PTRF) ao estudo correspondente; lista os arquivos (.pdf, .docx, .dotx) dessa pasta na tela; e oferece o link para a **Base Jurídica (RAG)**, onde você pode indexar esses arquivos para a IA usar em buscas e na geração de textos.
- **Desenho da funcionalidade futura:** atualização automática do formulário a partir do documento base (DOCX/DOTX), com código + IA + MCP + RAG → ver **`docs/FORMULARIO-DINAMICO-DOC-BASE.md`**.
- **Não faz (hoje):** não preenche automaticamente os campos do **formulário** PRADA/PTRF (empreendimento, requerente, áreas, cronograma etc.). Esse formulário continua sendo preenchido por você (ou pela escolha de cliente/empreendimento). A **IA** hoje é usada em outros fluxos: por exemplo na geração de **documentos/laudos** (template DOCX com blocos BLOCO_*), no **Assistente** e no preenchimento de **relatórios** (ex.: RCA). Usar o documento-base do PRADA (ex.: PRADA.dotx) para **preencher ou atualizar os campos do formulário** seria uma funcionalidade futura (ex.: botão “Preencher a partir do TR” que chama a IA com o TR indexado).

---

A pasta **`termos de referencia`** na raiz do projeto (ou em `TERMOS_REFERENCIA_DIR`) é carregada como um todo para indexação RAG e uso pela IA. No **primeiro momento** apenas dois estudos têm vínculo direto com uma subpasta:

| Estudo (submenu) | Subpasta vinculada | Caminho completo (exemplo) |
|------------------|--------------------|----------------------------|
| **PRADA**        | `PRADA`            | `E:\AmbientaR\termos de referencia\PRADA` |
| **PTRF**         | `PTRF`             | `E:\AmbientaR\termos de referencia\PTRF`  |

- **Menu:** Estudos Técnicos → PRADA e Estudos Técnicos → PTRF.
- Nas páginas **PRADA** e **PTRF** aparece o card **"Termos de referência vinculados"**, que mostra a pasta vinculada e a lista de arquivos (.pdf, .docx, .dotx) encontrados nela, além do link para a Base Jurídica (RAG).

## Demais pastas e estudos

As demais subpastas dentro de `termos de referencia` (ex.: LISTAGEM A–G, PCA GERAL, modelos de cabeçalho/rodapé, etc.) e os demais estudos do menu **não** estão vinculados neste primeiro momento. Elas ficam **aguardando comando específico de montagem** para serem vinculadas e terem as interações alocadas.

Quando quiser vincular outro estudo a uma subpasta:

1. Editar `src/lib/termos-referencia-config.ts`: adicionar o slug do estudo e o nome da subpasta em `STUDY_TR_FOLDER` e em `LINKED_STUDIES`.
2. Incluir o componente `<TermosReferenciaCard studySlug="..." studyLabel="..." />` na página do estudo correspondente.

## Configuração opcional

- **TERMOS_REFERENCIA_DIR:** se a aplicação não rodar na raiz do projeto, defina no `.env.local` o caminho absoluto da pasta, por exemplo:
  ```
  TERMOS_REFERENCIA_DIR=E:\AmbientaR\termos de referencia
  ```
- Se não for definido, o sistema usa `process.cwd() + 'termos de referencia'`.

## API

- **GET /api/termos-referencia/list?study=prada** — lista os arquivos da subpasta PRADA.
- **GET /api/termos-referencia/list?study=ptrf** — lista os arquivos da subpasta PTRF.
- Para outro estudo sem vínculo, a API retorna 404.
