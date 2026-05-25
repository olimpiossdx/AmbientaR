# Convenção de placeholders em templates Word (DOCX)

Os modelos de laudos (RCA, PIA, PCA, etc.) usam **placeholders** no texto para serem preenchidos automaticamente pelo sistema. Esta convenção está detalhada no `docs/PLANO-IMPLEMENTACAO.md` (seção 7); aqui está o resumo para desenvolvimento.

## Sintaxe

- Formato: `{{NOME_DO_CAMPO}}`
- Regras: MAIÚSCULAS, sem acentos, palavras separadas por `_`, entre `{{` e `}}`.

## Mapeamento: contexto ambiental → placeholders

O serviço de preenchimento (`src/lib/docx-placeholders.ts`) monta um objeto a partir de `AmbientalContext` com as chaves abaixo. No Word, use exatamente esses nomes.

### Empreendedor

| Placeholder | Origem |
|-------------|--------|
| `{{EMPREENDEDOR_NOME}}` | empreendedor.name |
| `{{EMPREENDEDOR_CPF_CNPJ}}` | empreendedor.cpfCnpj |
| `{{EMPREENDEDOR_ENDERECO_COMPLETO}}` | endereço formatado |
| `{{EMPREENDEDOR_MUNICIPIO}}` | empreendedor.municipio |
| `{{EMPREENDEDOR_UF}}` | empreendedor.uf |
| `{{EMPREENDEDOR_EMAIL}}` | empreendedor.email |
| `{{EMPREENDEDOR_TELEFONE}}` | empreendedor.phone |

### Empreendimento

| Placeholder | Origem |
|-------------|--------|
| `{{EMPREENDIMENTO_NOME}}` | empreendimento.propertyName |
| `{{EMPREENDIMENTO_ATIVIDADE}}` | empreendimento.activity |
| `{{EMPREENDIMENTO_MUNICIPIO}}` | empreendimento.municipio |
| `{{EMPREENDIMENTO_UF}}` | empreendimento.uf |
| `{{EMPREENDIMENTO_ENDERECO}}` | endereço formatado |

### Empresa ambiental

| Placeholder | Origem |
|-------------|--------|
| `{{EMPRESA_AMBIENTAL_RAZAO_SOCIAL}}` | empresaAmbiental.name |
| `{{EMPRESA_AMBIENTAL_CNPJ}}` | empresaAmbiental.cnpj |
| `{{EMPRESA_AMBIENTAL_ENDERECO}}` | endereço formatado |

### Resumos (listas)

| Placeholder | Conteúdo |
|-------------|----------|
| `{{RESUMO_LICENCAS_VIGENTES}}` | Texto resumindo licenças do empreendedor |
| `{{RESUMO_OUTORGAS}}` | Texto resumindo outorgas |
| `{{RESUMO_INTERVENCOES}}` | Texto resumindo intervenções (DAIA) |

### Dados geoespaciais (Passo 3 — análise SIG + Etapa 2)

Preenchidos quando o laudo importa `geo_analyses` (ver painel **Passo 3** na página do laudo):

| Placeholder | Conteúdo |
|-------------|----------|
| `{{GEO_AREA_HA}}` | Área do perímetro (ha) |
| `{{GEO_RESUMO_FACTUAL}}` | Resumo factual das 8 camadas |
| `{{GEO_TABELA_CAMADAS}}` | Tabela texto por camada (% / ha / km) |
| `{{GEO_CAMADAS_OK}}` | Ex.: `7/8` |
| `{{GEO_DATA_GERACAO}}` | Data UTC da análise |
| `{{GEO_MAPA_LEGENDA}}` | Referência aos mapas no PDF factual |
| `{{GEO_COMPLEMENTO_RESUMO}}` | Resumo executivo Etapa 2 (se existir) |
| `{{GEO_SECAO_HIDROGRAFIA}}` | Secção IA hidrografia (se existir) |

Os blocos `{{BLOCO_MEIO_FISICO}}`, `{{BLOCO_MEIO_BIOTICO_FLORA}}`, etc. recebem texto do complemento IA ou resumos factuais por camada.

### Blocos IA (Fase 4)

Estes são preenchidos com texto gerado pela IA (RAG + contexto). Se não houver geração, ficam em branco ou com texto padrão.

- `{{BLOCO_ENQUADRAMENTO_LEGAL}}`
- `{{BLOCO_DESCRICAO_PROJETO}}`
- `{{BLOCO_MEIO_FISICO}}`
- `{{BLOCO_MEIO_BIOTICO_FLORA}}`
- `{{BLOCO_MEIO_BIOTICO_FAUNA}}`
- `{{BLOCO_MEIO_SOCIOECONOMICO}}`
- `{{BLOCO_IMPACTOS_AMBIENTAIS}}`
- `{{BLOCO_MEDIDAS_MITIGADORAS}}`
- `{{BLOCO_PROGRAMAS_AMBIENTAIS}}`
- `{{BLOCO_CONCLUSAO_TECNICA}}`

## Onde ficam os templates

- **Desenvolvimento:** `public/templates/{tipo}/template.docx` (ex.: `public/templates/rca/template.docx`).
- O upload é feito em **Configurações > Templates** (ou via API `POST /api/templates/[type]`).
- Tipos aceitos: rca, pia, pca, prada, ptrf, eia-rima, las-ras, pea, reserva-legal, fauna, outorgas, barragens.

### Projeto Técnico de Barragem (slug `barragens`)

Além dos placeholders de contexto ambiental (`EMPREENDIMENTO_*`, `EMPREENDEDOR_*`, etc.), use:

| Placeholder | Conteúdo |
|-------------|----------|
| `{{APRESENTACAO}}` | Texto de apresentação |
| `{{USO_PRETENDIDO}}` | Uso da barragem |
| `{{DEFINICAO_BARRAGEM}}` | Seção 2 |
| `{{ATERRO}}` … `{{EXTRAVASOR}}` | Seções 4–11 |
| `{{HID_BACIA}}` … `{{HID_VAZAO_CHEIA}}` | Subitens hidrológicos |
| `{{TABELA_NIVEIS_RESERVATORIO}}` | Tabela cota/área/volume |
| `{{RT_NOME}}`, `{{RT_ART}}` | Responsável técnico |

Lista completa em `src/lib/barragem/barragem-placeholders.ts`. Sem template personalizado, a app gera Word com cabeçalho, rodapé e marca d'água via `buildBrandedDocxSectionSetup` (igual PIA).

## Exemplo de frase no Word

> O empreendimento **{{EMPREENDIMENTO_NOME}}**, localizado no município de **{{EMPREENDIMENTO_MUNICIPIO}}**/{{EMPREENDIMENTO_UF}}, de titularidade de **{{EMPREENDEDOR_NOME}}** ({{EMPREENDEDOR_CPF_CNPJ}}), é objeto do presente estudo.

O sistema substitui apenas os `{{...}}` e mantém o restante do texto.
