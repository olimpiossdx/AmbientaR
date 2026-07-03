# Integração Templates ↔ Termos de Referência ↔ RAG e preenchimento com IA

Este documento propõe a **melhor forma de conectar** a pasta de templates, a pasta **termos de referencia** e o fluxo MCP + RAG + OpenAI para preenchimento automático de relatórios, mantendo **dados locais** hoje (sem custo) e preparando para Firestore/Storage no futuro — no mesmo padrão do submenu de branding (cabeçalho, rodapé, marca d’água).

---

## 1. Situação atual (resumo)

| Recurso | Onde fica hoje | Quem usa |
|--------|-----------------|----------|
| **Branding** (cabeçalho, rodapé, marca d’água) | `public/branding/` (local) + API `/api/branding` | PDFs (relatórios, propostas, notas). Sem Firestore para os arquivos. |
| **Templates DOCX** (RCA, PIA, PCA, etc.) | `public/templates/{slug}/template.docx` (local) + API `/api/templates/[type]` | Gerar laudo: lê template, preenche placeholders com contexto MCP; blocos BLOCO_* ainda vazios (IA depois). |
| **Termos de referência** (TRs, normas, listagens) | Pasta **`termos de referencia`** na raiz do projeto | Script `import-termos-referencia`: lê pasta → cria `knowledge_sources` + `rag_index` no Firestore. Manual: colar trechos na Base Jurídica. |
| **Base Jurídica / RAG** | Firestore: `knowledge_sources` + `rag_index` | Assistente IA e (futuro) preenchimento dos BLOCO_* no DOCX. |

Hoje: **templates** e **branding** são 100% locais (sem custo). **Termos de referencia** é uma pasta na raiz; o conteúdo dela “sobe” para o Firestore só via script ou inserção manual. Não há vínculo explícito entre “qual template DOCX” e “quais TRs/normas” alimentam o RAG para aquele tipo de estudo.

---

## 2. Objetivo da integração

- **Templates** = base dos arquivos (DOCX) que viram relatório final, com placeholders.
- **Termos de referencia** = documentos-base que definem a estrutura do estudo, os campos a preencher e as normas a citar; devem alimentar o RAG e, quando possível, a definição de placeholders por tipo de estudo.
- **Cadastro do cliente** = dados primários (vistoria, fauna, monitoramento) e secundários (dados gerais do empreendimento/empreendedor).
- **IA (OpenAI)** = preencher blocos de texto (BLOCO_*), dissertar sobre dados secundários e, quando desejado, pesquisar na internet sobre o tema e fundamentar com RAG + dados do cadastro.

A “melhor conexão” é: **uma única noção de “dados do projeto”** (local agora, Firestore/Storage depois), com **uma ponte clara entre pasta de termos de referencia e templates**, para:
- extrair/definir placeholders e estrutura por tipo de estudo;
- alimentar o RAG com os TRs;
- no futuro, subir tudo para Firestore/Storage sem quebrar o fluxo.

---

## 3. Proposta: raiz de dados única + vínculo TR ↔ template

### 3.1 Raiz de dados única (local hoje, nuvem depois)

Mesmo padrão do branding: **tudo que for “arquivo do projeto” fica sob uma raiz configurável**.

- **Hoje (local, sem custo):**
  - **Raiz local:** por exemplo `public/ambientar-data/` (ou manter `public/templates/` e `public/branding/` e só acrescentar a pasta de TRs).
  - Subpastas sugeridas:
    - `public/ambientar-data/templates/{slug}/template.docx` — ou manter `public/templates/{slug}/template.docx`.
    - `public/ambientar-data/termos-referencia/` — **cópia ou link simbólico** da sua pasta `E:\AmbientaR\termos de referencia`, para o app e as APIs lerem no mesmo lugar.
  - Branding pode continuar em `public/branding/` (já estável) ou, se quiser tudo junto, mover para `public/ambientar-data/branding/`.

- **Amanhã (Firestore/Storage):**
  - Mesma “árvore” lógica: `templates/{slug}/template.docx`, `termos-referencia/{nome}.pdf`, etc., mas em **Firebase Storage**; nas coleções (ex.: `knowledge_sources`) guardamos `storagePath` apontando para esses arquivos.
  - O app passa a ler/escrever por Storage; a pasta local vira apenas fonte de importação ou backup.

Assim você **não duplica** a lógica de “onde está o arquivo”: hoje é filesystem (pasta local), depois é Storage; a API de indexação RAG (passo 4.1) já pode ser desenhada para aceitar os dois (local path ou `storagePath`).

### 3.2 Conexão pasta “termos de referencia” ↔ pasta “templates”

Ideia: **termos de referencia** são a “fonte da verdade” para **estrutura e conteúdo** do estudo; **templates** são o DOCX que materializa isso com placeholders.

- **Fluxo sugerido:**
  1. Você mantém (ou passa a usar) **uma única pasta** com os TRs: por exemplo `E:\AmbientaR\termos de referencia` → o app lê daqui (por caminho configurável, ex.: `TERMOS_REFERENCIA_DIR`) ou de uma cópia em `public/ambientar-data/termos-referencia/`.
  2. Por **tipo de estudo** (RCA, PIA, PCA, LISTAGEM A–G, etc.):
     - Os TRs (PDF/DOCX) dessa pasta definem **o que** deve constar no estudo (seções, itens, normas).
     - O **template** DOCX correspondente (em `public/templates/{slug}/` ou `public/ambientar-data/templates/{slug}/`) contém os **placeholders** (`{{...}}` e `{{BLOCO_*}}`) que o sistema e a IA preenchem.
  3. **Vínculo explícito (opcional mas útil):** em configuração (ex.: tela Templates ou nova tela “Termos de referência por estudo”), você associa:
     - **Template** (ex.: `rca`) → **lista de fontes em `knowledge_sources`** ou **lista de arquivos da pasta** (ex.: “TR PCA Geral”, “LISTAGEM A”) que alimentam o RAG para aquele tipo de estudo. Assim, ao gerar um RCA, o sistema já sabe quais TRs/normas priorizar na busca RAG e na geração dos BLOCO_*.

Isso “integra” as duas pastas no fluxo: **termos de referencia** alimentam RAG e estrutura; **templates** são o DOCX final a ser preenchido.

### 3.3 Dados primários e secundários + IA

- **Dados primários (já no programa):** vistorias recentes, estudos de fauna, relatórios de monitoramento de fauna do local — tudo isso já pode ser levado ao contexto MCP por empreendimento/empreendedor.
- **Dados secundários:** cadastro do cliente (empreendedor, empreendimento, licenças, outorgas, etc.) + o que a IA “pesquisa” ou disserta a partir do RAG e, se quiser, da internet (ex.: tema do estudo).
- **Preenchimento automático:** MCP monta o contexto; RAG traz trechos dos TRs/normas (pasta termos de referencia indexada em `rag_index`); OpenAI preenche os BLOCO_* e pode dissertar sobre dados secundários e, em cenário futuro, sobre pesquisa na web.

Não muda a arquitetura atual; só deixa explícito que a pasta **termos de referencia** é a base que vira RAG e que pode ser ligada por tipo de estudo ao **template** correspondente.

---

## 4. Desenho do fluxo unificado (diagrama em texto)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PASTA LOCAL (hoje) / STORAGE (futuro)                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │ termos de referencia/    │  │ templates/{rca,pia,pca,...}/template.docx │ │
│  │ (TRs, listagens, normas) │  │ (placeholders {{...}} e {{BLOCO_*}})       │ │
│  └────────────┬─────────────┘  └────────────────────┬─────────────────────┘ │
│               │                                      │                       │
│               │ script ou API "indexar"              │ leitura na geração    │
│               ▼                                      │ do laudo              │
│  ┌────────────────────────────┐                     │                       │
│  │ Firestore:                 │                     │                       │
│  │  knowledge_sources         │◄────────────────────┘                       │
│  │  rag_index                 │   (opcional: vínculo template ↔ fontes TR)  │
│  └────────────┬───────────────┘                                              │
└───────────────┼──────────────────────────────────────────────────────────────┘
                │
                │ queryRagChunks + getAmbientalContext
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  GERAÇÃO DO LAUDO (DOCX)                                                     │
│  1. Carregar contexto MCP (cadastro: empreendedor, empreendimento,          │
│     licenças, outorgas, vistorias, fauna, monitoramento).                    │
│  2. Buscar trechos RAG (termos de referencia + normas já indexados).         │
│  3. Para cada BLOCO_*: OpenAI disserta com MCP + RAG (+ internet se quiser). │
│  4. Substituir placeholders no template DOCX e entregar/baixar.              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Ações sugeridas (em cima dessa proposta)

### 5.1 Curto prazo (sem custo, local)

1. **Definir uma raiz única de “dados do projeto” (configurável)**  
   - Ex.: variável de ambiente `AMBIENTAR_DATA_DIR` (padrão `public/ambientar-data` ou `.`).  
   - Subpastas: `templates/`, `termos-referencia/`.  
   - Branding pode continuar em `public/branding/`; só documentar que “templates e termos” seguem a raiz única.

2. **Integrar a pasta `termos de referencia` ao app sem duplicar**  
   - **Opção A:** App e API leem diretamente de `E:\AmbientaR\termos de referencia` quando `TERMOS_REFERENCIA_DIR` estiver definido (ex.: no `.env.local`).  
   - **Opção B:** Manter a pasta na raiz como está; na API de indexação RAG (passo 4.1), além de “arquivo no Storage”, aceitar “arquivo em path local” (ex.: `termos de referencia/TR PCA geral.pdf`) para quem ainda não usa Storage.  
   Assim a mesma pasta que o script usa vira fonte para o app; não precisa copiar para `public/` se não quiser.

3. **Vínculo template ↔ TRs (configuração)**  
   - Na tela **Configurações → Templates** (ou nova seção “Termos de referência por estudo”): para cada slug (rca, pia, pca, etc.), permitir escolher **quais fontes da Base Jurídica** (ou quais arquivos da pasta termos de referencia) são prioritárias para aquele tipo de estudo.  
   - Guardar em Firestore (ex.: `companySettings.templateTermosRef` ou coleção `template_config`) ou em JSON local (ex.: `public/ambientar-data/template-termos.json`).  
   - Na geração do DOCX, usar essa configuração para filtrar/priorizar trechos RAG por tipo de estudo.

4. **API de indexação RAG (passo 4.1)**  
   - Suportar **dois modos**: (1) arquivo em **Storage** (`storagePath`); (2) arquivo em **path local** (ex.: `termos de referencia/nome.pdf`), quando rodando local e sem Storage.  
   - Assim você continua usando a pasta local para testes e depois sobe para Storage sem mudar o fluxo.

### 5.2 Médio prazo (preparar para nuvem)

5. **Upload de TRs/templates pela tela**  
   - Em **Base Jurídica**: upload de PDF/DOCX → salvar em Storage (ou, em dev, em `public/ambientar-data/termos-referencia/`) e preencher `storagePath` (ou path local) na fonte.  
   - Em **Templates**: manter o fluxo atual de upload para `public/templates/{slug}/`; depois, opção “subir para Storage” e passar a ler de lá.

6. **Sincronização pasta local ↔ Firestore/Storage**  
   - Comando ou job: “Ler pasta `termos de referencia` (ou `ambientar-data/termos-referencia`), criar/atualizar `knowledge_sources` e indexar em `rag_index`” — é o que o script já faz; pode ganhar uma entrada na UI (ex.: “Importar da pasta local”) que chama esse fluxo sem rodar script à mão.

### 5.3 Resumo das ações

| # | Ação | Objetivo |
|---|------|----------|
| 1 | Raiz configurável `AMBIENTAR_DATA_DIR` + subpastas `templates/`, `termos-referencia/` | Um lugar só para “dados do projeto”; depois trocar por Storage. |
| 2 | App/API lerem `termos de referencia` da raiz (env) ou de `ambientar-data/termos-referencia` | Integrar a pasta que você já usa ao app, sem duplicar. |
| 3 | Vínculo template ↔ TRs (por tipo de estudo) em config | RAG e IA priorizam os TRs certos para cada template. |
| 4 | API index-rag com modo local + modo Storage | Rodar sem custo agora; migrar para Firestore/Storage depois. |
| 5 | Upload de TRs/templates pela tela (local ou Storage) | Mesmo padrão do branding: subir arquivos pela aplicação. |
| 6 | “Importar da pasta local” na UI (opcional) | Disparar o mesmo fluxo do script de importação pela interface. |

---

## 6. Conclusão

- **Melhor forma de conectar** templates e termos de referencia: tratar **termos de referencia** como a base que alimenta **RAG** e a **estrutura** por tipo de estudo, e **templates** como o DOCX com placeholders que o MCP + RAG + OpenAI preenchem; com um **vínculo explícito** (config) entre tipo de estudo e fontes/TRs.
- **Melhor forma de manter local e sem custo:** mesma estratégia do branding — raiz de dados em disco (ex.: `public/ambientar-data/` e/ou pasta `termos de referencia` na raiz), APIs lendo daí; depois, mesma árvore em Storage e migração progressiva.
- **Próximo passo prático:** implementar a API de indexação RAG (4.1) com suporte a **path local** (pasta `termos de referencia`) e, em paralelo, adicionar a config de vínculo **template ↔ TRs** (arquivo ou Firestore) e usar essa config na geração do DOCX quando os BLOCO_* forem preenchidos pela IA.

Se quiser, no próximo passo podemos detalhar só a parte “vínculo template ↔ termos de referencia” (campos, tela, formato do JSON/Firestore) ou só a extensão da API 4.1 para path local.
