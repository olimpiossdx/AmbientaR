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

## Exemplo de frase no Word

> O empreendimento **{{EMPREENDIMENTO_NOME}}**, localizado no município de **{{EMPREENDIMENTO_MUNICIPIO}}**/{{EMPREENDIMENTO_UF}}, de titularidade de **{{EMPREENDEDOR_NOME}}** ({{EMPREENDEDOR_CPF_CNPJ}}), é objeto do presente estudo.

O sistema substitui apenas os `{{...}}` e mantém o restante do texto.
