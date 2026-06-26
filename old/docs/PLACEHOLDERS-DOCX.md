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
- Tipos aceitos: rca, pia, pca, prada, ptrf, eia-rima, las-ras, pea, reserva-legal, fauna, outorgas, barragens, seguranca-barragens, piscinao-off-stream.

### Projeto Técnico de Barragem (slug `barragens`)

Menu: **Estudos Técnicos → Projetos e Segurança de Barragens → Projeto técnico**.

Código: `src/lib/barragem/barragem-placeholders.ts` (`buildBarragemPlaceholderExtras`).

Sem template personalizado em Configurações → Templates, a app gera Word com branding (`buildBrandedDocxSectionSetup`). Com template `.docx`, os placeholders abaixo são substituídos.

#### Identificação e empreendimento

| Placeholder | Origem no formulário |
|-------------|----------------------|
| `{{ARQUIVO_CODIGO}}` | Código do arquivo |
| `{{APRESENTACAO}}` | Apresentação |
| `{{REQUERENTE_NOME}}` | Requerente — nome |
| `{{REQUERENTE_CPF_CNPJ}}` | Requerente — CPF/CNPJ |
| `{{EMPREENDIMENTO_DENOMINACAO}}` | Empreendimento — denominação |
| `{{EMPREENDIMENTO_MUNICIPIO}}` | Município |
| `{{EMPREENDIMENTO_UF}}` | UF |
| `{{EMPREENDIMENTO_CAR}}` | CAR |
| `{{EMPREENDIMENTO_MATRICULA}}` | Matrícula |
| `{{USO_PRETENDIDO}}` | Uso pretendido |
| `{{ESPELHO_DAGUA_M2}}` | Espelho d'água (m²) |
| `{{CAPACIDADE_ARMAZENAMENTO_M3}}` | Capacidade de armazenamento (m³) |
| `{{LOCAL_EMISSAO}}` | Local de emissão |
| `{{DATA_EMISSAO}}` | Data de emissão |
| `{{BARRAGEM_STATUS}}` | Rascunho / Aprovado |

#### Responsável técnico

| Placeholder | Origem |
|-------------|--------|
| `{{RT_NOME}}` | Nome |
| `{{RT_CPF}}` | CPF |
| `{{RT_EMAIL}}` | E-mail |
| `{{RT_TELEFONE}}` | Telefone |
| `{{RT_FORMACAO}}` | Formação |
| `{{RT_REGISTRO_CONSELHO}}` | Registro no conselho |
| `{{RT_ART}}` | ART |

#### Localização e reservatório

| Placeholder | Origem |
|-------------|--------|
| `{{INFO_TOPOGRAFICAS}}` | Informações topográficas |
| `{{LATITUDE}}` | Latitude |
| `{{LONGITUDE}}` | Longitude |
| `{{ALTITUDE}}` | Altitude |
| `{{DEFINICAO_BARRAGEM}}` | Definição da barragem (tipo de estrutura) |
| `{{CAPACIDADE_DESCRICAO}}` | Descrição da capacidade |
| `{{COTA_ESPELHO_DAGUA}}` | Cota do espelho d'água |
| `{{COTA_TERRENO_NATURAL}}` | Cota do terreno natural |
| `{{AREA_ESPELHO_M2}}` | Área do espelho (m²) |
| `{{VOLUME_ARMAZENADO_M3}}` | Volume armazenado (m³) |
| `{{TABELA_NIVEIS_RESERVATORIO}}` | Tabela cota / área / volume (texto) |

#### Estruturas e memorial (seções 4–8)

| Placeholder | Origem |
|-------------|--------|
| `{{ATERRO}}` | Aterro |
| `{{TALUDES_ATERRO}}` | Taludes do aterro |
| `{{FUNDACAO}}` | Fundação |
| `{{DRENO_PE}}` | Dreno de pé |
| `{{DESCARGA_FUNDO}}` | Descarga de fundo |

#### Hidrologia e extravasor

| Placeholder | Origem |
|-------------|--------|
| `{{HID_BACIA}}` | Características da bacia |
| `{{HID_TEMPO_CONCENTRACAO}}` | Tempo de concentração (memorial) |
| `{{HID_INTENSIDADE_CHUVA}}` | Intensidade da chuva |
| `{{HID_COEFICIENTE_ESCOAMENTO}}` | Coeficiente de escoamento |
| `{{HID_VAZAO_CHEIA}}` | Vazão de cheia (memorial) |
| `{{MEMORIAL_CALCULO}}` | Memorial automático (Tc, Q, vertedouro) |
| `{{DIMENSIONAMENTO_CHEIA}}` | Dimensionamento à capacidade de cheia |
| `{{EXTRAVASOR}}` | Extravasor |
| `{{IMPLANTACAO_PROJETO}}` | Implantação |
| `{{CONSERVACAO_MANUTENCAO}}` | Conservação e manutenção |
| `{{LITERATURA_CONSULTADA}}` | Literatura consultada |
| `{{ANEXOS_DESCRICAO}}` | Descrição dos anexos |

#### Rippl (regularização)

| Placeholder | Origem |
|-------------|--------|
| `{{VOLUME_UTIL_RIPPL_M3}}` | Volume útil Rippl (m³) |
| `{{DEMANDA_ANUAL_RIPPL_M3}}` | Demanda anual (m³) |
| `{{RIPPL_MEMORIAL}}` | Memorial e série mensal (texto) |

#### Geotecnia (Bishop / Morgenstern-Price)

| Placeholder | Origem |
|-------------|--------|
| `{{METODO_GEOTECNICO}}` | `Bishop simplificado` ou `Morgenstern-Price (meia-seno)` |
| `{{FS_BISHOP}}` | FS calculado (qualquer método) |
| `{{FS_MORGENSTERN}}` | FS quando método = Morgenstern-Price; vazio se Bishop |
| `{{LAMBDA_MORGENSTERN}}` | λ interfatias (só Morgenstern-Price) |
| `{{BISHOP_MEMORIAL}}` | Memorial geotécnico (Bishop ou MP) |

#### Concreto gravidade (tipo de estrutura)

| Placeholder | Origem |
|-------------|--------|
| `{{FS_DESLIZAMENTO}}` | FS deslizamento |
| `{{FS_TOMBAMENTO}}` | FS tombamento |
| `{{TENSAO_BASE_MEDIA_KPA}}` | σ média na base (kPa) |
| `{{TENSAO_BASE_MAX_KPA}}` | σ máxima na base (kPa) |
| `{{TENSAO_BASE_MIN_KPA}}` | σ mínima na base (kPa) |
| `{{CONCRETO_GRAVIDADE_MEMORIAL}}` | Memorial estrutural |

Campos vazios são exportados como `—`.

---

### Segurança de Barragens (slug `seguranca-barragens`)

Menu: **Estudos Técnicos → Projetos e Segurança de Barragens → Segurança e emergência**.

Código: `src/lib/seguranca-barragens/export-placeholders.ts` (`buildSegurancaPlaceholderExtras`).

#### Identificação e classificação

| Placeholder | Origem |
|-------------|--------|
| `{{SEGURANCA_STATUS}}` | Rascunho / Aprovado |
| `{{REQUERENTE_NOME}}` | Requerente — nome |
| `{{REQUERENTE_CPF_CNPJ}}` | Requerente — CPF/CNPJ |
| `{{EMPREENDIMENTO_NOME}}` | Nome do empreendimento |
| `{{EMPREENDIMENTO_MUNICIPIO}}` | Município |
| `{{EMPREENDIMENTO_UF}}` | UF |
| `{{RT_NOME}}` | Responsável técnico — nome |
| `{{RT_FORMACAO}}` | Formação |
| `{{RT_REGISTRO_CONSELHO}}` | Registro no conselho |
| `{{RT_ART}}` | ART |
| `{{CLASSIFICACAO_CRI}}` | Categoria de risco (CRI) |
| `{{CLASSIFICACAO_DPA}}` | Dano potencial associado (DPA) |
| `{{VOLUME_RESERVATORIO_M3}}` | Volume do reservatório (m³) |
| `{{ALTURA_BARRAGEM_M}}` | Altura da barragem (m) |
| `{{DATA_EMISSAO}}` | Data de emissão |
| `{{LOCAL_EMISSAO}}` | Local de emissão |

#### Secções completas (texto agregado)

| Placeholder | Conteúdo |
|-------------|----------|
| `{{SECAO_IDENTIFICACAO}}` | Aba Identificação |
| `{{SECAO_CLASSIFICACAO}}` | Classificação preliminar |
| `{{SECAO_PSB}}` | Plano de Segurança da Barragem |
| `{{SECAO_INSPECAO}}` | Inspeção de segurança regular |
| `{{SECAO_PAE}}` | Plano de Ação de Emergência |
| `{{SECAO_DAM_BREAK}}` | Dam Break — triagem |
| `{{SECAO_HEC_RAS}}` | Resultados HEC-RAS importados |

#### Dam Break / HEC-RAS (campos resumidos)

| Placeholder | Origem |
|-------------|--------|
| `{{HEC_RAS_AREA_INUNDADA_M2}}` | Área inundada (importação) |
| `{{HEC_RAS_PROFUNDIDADE_MAX_M}}` | Profundidade máxima (m) |
| `{{HEC_RAS_VELOCIDADE_MAX_MS}}` | Velocidade máxima (m/s) |
| `{{HEC_RAS_TEMPO_CHEGADA_MIN}}` | Tempo de chegada mínimo (min) |
| `{{HEC_RAS_MEMORIAL}}` | Memorial da importação HEC-RAS |

#### Vínculos (IDs Firestore)

| Placeholder | Origem |
|-------------|--------|
| `{{VINCULO_PROJETO_BARRAGEM_ID}}` | Projeto técnico de barragem |
| `{{VINCULO_OUTORGA_ID}}` | Processo de outorga |
| `{{VINCULO_RCA_ID}}` | RCA |
| `{{VINCULO_PCA_ID}}` | PCA |

---

### Piscinão off-stream (slug `piscinao-off-stream`)

Menu: **Estudos Técnicos → Projetos e Segurança de Barragens → Piscinão (off-stream)**.

Código: `src/lib/piscinao-off-stream/export-placeholders.ts` (`buildPiscinaoPlaceholderExtras`).

| Placeholder | Origem |
|-------------|--------|
| `{{PISCINAO_STATUS}}` | Rascunho / Aprovado |
| `{{REQUERENTE_NOME}}` | Requerente — nome |
| `{{REQUERENTE_CPF_CNPJ}}` | Requerente — CPF/CNPJ |
| `{{EMPREENDIMENTO_NOME}}` | Nome do empreendimento |
| `{{EMPREENDIMENTO_MUNICIPIO}}` | Município |
| `{{EMPREENDIMENTO_UF}}` | UF |
| `{{RT_NOME}}` | Responsável técnico — nome |
| `{{RT_FORMACAO}}` | Formação |
| `{{RT_REGISTRO_CONSELHO}}` | Registro no conselho |
| `{{RT_ART}}` | ART |
| `{{USO_PRETENDIDO}}` | Uso pretendido |
| `{{CAPACIDADE_UTIL_M3}}` | Capacidade útil (m³) |
| `{{ESPELHO_DAGUA_M2}}` | Espelho d'água (m²) |
| `{{VOLUME_UTIL_RIPPL_M3}}` | Volume útil Rippl (m³) |
| `{{DEMANDA_ANUAL_M3}}` | Demanda anual (m³) |
| `{{SECAO_IDENTIFICACAO}}` | Identificação |
| `{{SECAO_CARACTERISTICAS}}` | Características do reservatório |
| `{{SECAO_DEMANDA}}` | Demanda hídrica |
| `{{SECAO_RIPPL}}` | Regularização — Rippl |
| `{{DATA_EMISSAO}}` | Data de emissão |
| `{{LOCAL_EMISSAO}}` | Local de emissão |
| `{{VINCULO_PROJETO_BARRAGEM_ID}}` | Projeto técnico vinculado |
| `{{VINCULO_OUTORGA_ID}}` | Outorga vinculada |

---

### Referência rápida — módulo Barragens

| Slug template | Função de placeholders | Export DOCX |
|---------------|------------------------|-------------|
| `barragens` | `buildBarragemPlaceholderExtras` | `src/lib/barragem/export-docx.ts` |
| `seguranca-barragens` | `buildSegurancaPlaceholderExtras` | `src/lib/seguranca-barragens/export-docx.ts` |
| `piscinao-off-stream` | `buildPiscinaoPlaceholderExtras` | `src/lib/piscinao-off-stream/export-docx.ts` |

Upload do template: **Configurações → Templates** (coleção `companySettings/docxTemplates`).

## Exemplo de frase no Word

> O empreendimento **{{EMPREENDIMENTO_NOME}}**, localizado no município de **{{EMPREENDIMENTO_MUNICIPIO}}**/{{EMPREENDIMENTO_UF}}, de titularidade de **{{EMPREENDEDOR_NOME}}** ({{EMPREENDEDOR_CPF_CNPJ}}), é objeto do presente estudo.

O sistema substitui apenas os `{{...}}` e mantém o restante do texto.
