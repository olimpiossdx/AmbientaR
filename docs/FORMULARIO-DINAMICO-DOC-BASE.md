# Formulário dinâmico a partir do documento base (DOCX/DOTX)

## Objetivo

Os **campos dos formulários de cada estudo** (submenus como PRADA, PTRF, etc.) devem ser **atualizados automaticamente** pelo sistema quando o **arquivo base** (DOCX ou DOTX) vinculado ao estudo for carregado.

- **Fonte da verdade:** o documento base (ex.: `PRADA.dotx` em `termos de referencia/PRADA`) define a estrutura e os dados esperados do estudo.
- **Comportamento:** ao carregar esse arquivo, o código + IA + MCP + RAG **ajustam o formulário de preenchimento** — sem alterar manualmente o código-fonte do form (Zod/React). Tudo ocorre “somente com o carregamento do arquivo base”.

---

## 1. Especificação do schema do formulário (JSON)

### 1.1 Documento raiz

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `version` | string | sim | Versão do schema, ex.: `"1.0"`. |
| `studySlug` | string | sim | Slug do estudo (ex.: `prada`, `ptrf`). |
| `sourceFile` | string | não | Nome do arquivo base que originou o schema (ex.: `PRADA.dotx`). |
| `processedAt` | string (ISO 8601) | não | Data/hora do processamento do documento base. |
| `sections` | array de Section | sim | Seções do formulário (agrupamento de campos). |

### 1.2 Seção (Section)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | Identificador único da seção (ex.: `requerente`, `empreendimento`). |
| `title` | string | sim | Título exibido na UI. |
| `description` | string | não | Texto de ajuda da seção. |
| `fields` | array de Field | não | Campos diretos da seção (para tipo não-array/não-object). |
| `type` | `"object"` \| `"array"` | não | Se `object`, os itens de `fields` formam um grupo; se `array`, a seção é repetível e usa `itemFields`. |
| `itemFields` | array de Field | não | Usado quando `type === "array"`; define os campos de cada item da lista. |

### 1.3 Campo (Field)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | sim | Chave do campo (ex.: `nome`, `cpfCnpj`). |
| `label` | string | sim | Rótulo na UI. |
| `type` | FieldType | sim | Ver tabela de tipos abaixo. |
| `required` | boolean | não | Default `false`. |
| `placeholder` | string | não | Placeholder do input. |
| `hint` | string | não | Texto de ajuda. |
| `defaultFromMcp` | string | não | Caminho no contexto MCP para pré-preencher (ex.: `empreendedor.nome`, `empreendimento.car`). |
| `options` | array de { value: string, label: string } | não | Para `type === "select"`. |
| `optionsSource` | `"clients"` \| `"projects"` | não | Para select que carrega lista do sistema. |

**FieldType:** `string` | `text` | `number` | `date` | `boolean` | `select` | `array` | `object`

- `string`: linha única (input text).
- `text`: múltiplas linhas (textarea).
- `number`, `date`, `boolean`: tipos primitivos.
- `select`: dropdown; opções em `options` ou `optionsSource`.
- `array`: lista de itens; estrutura do item em `itemFields` da seção ou em campo aninhado.
- `object`: grupo de campos; campos filhos em `fields` (array de Field).

### 1.4 Exemplo mínimo (PRADA – requerente e empreendimento)

```json
{
  "version": "1.0",
  "studySlug": "prada",
  "sourceFile": "PRADA.dotx",
  "processedAt": "2025-03-13T12:00:00.000Z",
  "sections": [
    {
      "id": "requerente",
      "title": "Requerente",
      "type": "object",
      "fields": [
        { "id": "clientId", "label": "Cliente", "type": "select", "optionsSource": "clients", "required": false },
        { "id": "nome", "label": "Nome", "type": "string", "required": true, "defaultFromMcp": "empreendedor.nome" },
        { "id": "cpfCnpj", "label": "CPF/CNPJ", "type": "string", "required": true, "defaultFromMcp": "empreendedor.cpfCnpj" }
      ]
    },
    {
      "id": "empreendimento",
      "title": "Empreendimento",
      "type": "object",
      "fields": [
        { "id": "projectId", "label": "Empreendimento", "type": "select", "optionsSource": "projects", "required": false },
        { "id": "nome", "label": "Nome", "type": "string", "required": true, "defaultFromMcp": "empreendimento.nome" },
        { "id": "denominacao", "label": "Denominação do imóvel", "type": "string", "required": true },
        { "id": "car", "label": "N.º Recibo CAR", "type": "string", "required": true, "defaultFromMcp": "empreendimento.car" },
        { "id": "matricula", "label": "Matrícula", "type": "string", "required": true, "defaultFromMcp": "empreendimento.matricula" }
      ]
    }
  ]
}
```

---

## 2. Contratos de API

### 2.1 GET `/api/studies/[slug]/form-schema`

Obtém o schema do formulário do estudo.

**Parâmetros de query (opcionais):**

| Nome | Tipo | Descrição |
|------|------|-----------|
| `source` | `static` \| `docx` \| `auto` | `static`: usa apenas schema estático (código). `docx`: tenta gerar a partir do documento base. `auto` (default): retorna schema em cache/Firestore se existir; senão, tenta construir a partir do DOCX/DOTX; senão, retorna schema estático. |
| `refresh` | `1` | Se `source=docx` ou `auto`, força reprocessamento do arquivo base (ignora cache). |

**Resposta 200 (sucesso):**

```ts
{
  success: true,
  schema: StudyFormSchema;   // conforme §1
  source: "static" | "docx" | "cache";
}
```

**Resposta 404:** estudo sem vínculo ou slug inválido.

**Resposta 500:** erro ao ler/processar arquivo base.

### 2.2 POST `/api/termos-referencia/extract-structure` (opcional)

Corpo: `{ "studySlug": "prada" }` ou `{ "filePath": "caminho/relativo/ao/termos de referencia/PRADA/arquivo.dotx" }`.

Resposta: estrutura bruta extraída do DOCX/DOTX (seções/títulos, placeholders `{{...}}`, tabelas). Usada internamente pelo GET form-schema quando `source=docx` ou `auto`.

---

## 3. Convenção do “arquivo base”

- Para cada estudo com vínculo (ex.: `prada` → pasta `PRADA`), o **arquivo base** é o primeiro arquivo **.dotx** (prioridade) ou **.docx** encontrado na pasta, em ordem alfabética. Ex.: `PRADA.dotx` em `termos de referencia/PRADA`.
- Configurável no futuro: campo `baseFileName` em `termos-referencia-config` ou em Firestore por estudo, para apontar para um arquivo específico.

---

## 4. Fluxo de dados (resumo)

```
Arquivo base (DOCX/DOTX) → [Extração de estrutura] → estrutura bruta
                                                          ↓
[Regras: placeholders → campos; títulos → seções]  ou  [IA + RAG] → schema JSON
                                                          ↓
                        Firestore (study_forms/{slug}) ou resposta direta
                                                          ↓
GET /api/studies/[slug]/form-schema → frontend → DynamicStudyForm (renderiza a partir do schema)
                                                          ↓
MCP (contexto ambiental) → pré-preenche campos com defaultFromMcp
```

---

## 5. Quando dispara a atualização

| Disparo | Comportamento |
|---------|----------------|
| **Ao abrir a página do estudo** (ex.: `/studies/prada/new`) | Front chama `GET /api/studies/prada/form-schema?source=auto`. Backend devolve schema (cache, docx ou estático). Formulário é renderizado com esse schema ou fallback para form estático. |
| **Botão “Atualizar a partir do documento”** | Chama `GET form-schema?source=docx&refresh=1` e recarrega o form com o novo schema. |
| **Indexação TR** | Ao indexar pasta TR para RAG, opcionalmente rodar extração e salvar schema em Firestore. |

---

## 6. Persistência

- **Firestore:** coleção `study_forms`, documento id = `studySlug`. Campos: `schema` (objeto), `sourceFile`, `processedAt`, `version`. Opcional: `updatedAt`.
- **Fallback:** se não houver schema (nem estático nem gerado), a aplicação usa o **formulário estático** atual (React/Zod) para não quebrar.

---

## 7. Fases de implementação (detalhadas)

### Fase 1 – Tipos e schema estático ✅ (implementado)
- Tipos em `src/lib/study-form-schema.ts`: `StudyFormSchema`, `Section`, `Field`, `FieldType`.
- Schema estático para `prada` e `ptrf` (espelhando campos atuais).
- GET `/api/studies/[slug]/form-schema`: retorna schema estático ou gerado a partir do DOCX.

### Fase 2 – Extração de estrutura DOCX ✅ (implementado)
- Função `extractDocxStructure` em `src/lib/docx-extract-structure.ts`: lê DOCX com PizZip, extrai placeholders `{{...}}` e títulos (w:pStyle Heading).
- GET form-schema com `source=docx` ou `source=auto` e `refresh=1`: usa arquivo base da pasta TR, chama extração e monta schema mínimo (placeholders → campos; headings → seções).

### Fase 3 – Componente DynamicStudyForm ✅ (implementado)
- Componente `src/components/dynamic-study-form.tsx`: recebe `schema` e `defaultValues`, renderiza seções e campos com React Hook Form. Suporta `string`, `text`, `number`, `date`, `select` (optionsSource: clients/projects), `array` com itemFields.
- Preenchimento ao selecionar cliente/empreendimento (setValue a partir de clients/projects).
- Páginas PRADA e PTRF: uso com **`?form=dynamic`** (ex.: `/studies/prada/new?form=dynamic`). Sem o parâmetro, exibe o form estático (PradaForm/PtrfForm). No card de TR há o botão **"Novo com formulário do documento"** que leva a `new?form=dynamic`.

### Fase 4 – IA + RAG na geração do schema
- Após extração, enviar estrutura + trechos RAG ao modelo (OpenAI); prompt para retornar lista de campos (id, label, type, required, section). Mesclar com schema gerado por regras.
- Persistir schema enriquecido em Firestore.

### Fase 5 – MCP no formulário dinâmico
- Ao abrir o form ou ao selecionar cliente/empreendimento, obter contexto ambiental (getAmbientalContext) e mapear para campos com `defaultFromMcp`. Atualizar valores iniciais do form.

---

## 8. Referências no projeto

- Vínculo TR ↔ estudo: `src/lib/termos-referencia-config.ts`
- Listagem de arquivos TR: `GET /api/termos-referencia/list?study=prada|ptrf`
- Contexto MCP: `src/lib/ambiental-context.ts`, tipos em `src/lib/types.ts`
- RAG: `src/lib/rag.ts`
- Placeholders DOCX: `src/lib/docx-placeholders.ts`
- Formulários estáticos: `src/app/(app)/studies/prada/prada-form.tsx`, `ptrf/ptrf-form.tsx`
- DOCX (PizZip/docxtemplater): `src/app/api/laudos/gerar-docx/route.ts`
