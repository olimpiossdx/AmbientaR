# Plano — Hub Análise Socioambiental (AmbientaR)

Documento de referência para implementação. Atualizado após alinhamento com extratos Sicoob/AgroTools (exemplo W Egido) e decisões de produto.

## 1. Visão do produto

O módulo **Análise Socioambiental** (`/studies/analise-socioambiental`) é o hub para consultas de conformidade e risco em **qualquer atividade** (rural, urbana, industrial, infraestrutura), não apenas área rural.

Três modos de saída:

| ID | Nome | Conteúdo principal |
|----|------|-------------------|
| `extrato_socioambiental` | **Extrato Socioambiental** | Matriz de critérios + detalhes + mapa |
| `extrato_risco_socioambiental` | **Extrato Risco Socioambiental** | Sobreposição/proximidade por geometria + histórico CAR |
| `extrato_completo` | **Extrato Socioambiental completo** | Funde os dois sem redundância |

Motor geoespacial Wave A permanece como backend de camadas; o pacote socioambiental orquestra critérios, listas CPF/CNPJ, proximidade, buffers e PDFs.

## 2. Semáforo de critérios (4 níveis)

| Estado | Cor UI/PDF | Significado |
|--------|------------|-------------|
| **Apto** | Verde | Sem restrição bloqueante no recorte |
| **Alerta** | Amarelo | Atenção; não bloqueia sozinho |
| **Inapto** | Vermelho | Restrição bloqueante |
| **Não Analisado** | Cinza | Fonte indisponível ou fora de escopo |

### Regras fixas

- **Buffer 3 km** (UC, TI, Quilombolas, IPHAN): sempre **Alerta**, nunca Inapto.
- **Proximidade** sem sobreposição: **Alerta** + distância em metros no detalhe.
- **Sobreposição** em critério bloqueante: **Inapto**.
- **Listas** (trabalho escravo, embargo por CPF/CNPJ): positivo → **Inapto**; falha de serviço → **Não Analisado**.
- **Histórico CAR** com risco que desapareceu no CAR atual: **Alerta** (possível omissão).

Tipo: `ResultadoCriterioStatus` em `src/lib/types/analise-socioambiental.ts`.

## 3. Veredito global (Risco / completo)

| Veredito | Condição |
|----------|----------|
| `em_conformidade` | Só critérios Apto |
| `em_conformidade_com_alertas` | Apto + Alertas, sem Inapto |
| `com_restricoes` | Pelo menos um Inapto (imóvel ou gleba) |
| `analise_incompleta` | Critérios essenciais Não Analisados |

## 4. Entradas do fluxo (wizard)

### 4.1 Modo e opções

- Modo de relatório (3 opções acima).
- **PRODES:** `por_ano` | `agregado` (toggle).
- **Preset de atividade:** `mg_padrao` | `credito_rural` | `empreendimento_geral` | `protocolo_personalizado`.
- Checkboxes por bloco/critério (subconjunto do catálogo).

### 4.2 Geometrias

| Elemento | Obrigatoriedade | Uso |
|----------|-----------------|-----|
| **Perímetro principal** | Sim | Polígono da operação |
| **CAR** | Opcional | `tipoPerimetro: car_rural` — metadados SICAR + histórico |
| **Glebas 1..N** | Opcional | CPR, talhões, áreas contratuais |

- Rural: CAR recomendado.
- Demais atividades: polígono + agente + descrição da atividade bastam.

### 4.3 Agentes

- Tomador / responsável: CPF ou CNPJ.
- Beneficiários CPR (modo risco): lista opcional.
- Consultas tabulares dependem de documento informado.

## 5. Escopo geográfico

**V1:** Minas Gerais + camadas federais.

- Critérios estaduais específicos de outras UFs (SEMA-MT, LDI-PA): **Não Analisado** com motivo "fora do escopo MG".
- Catálogo com `ufsAplicaveis` para expansão futura Brasil.

## 6. Catálogo de critérios ✅

Ficheiro `src/lib/socioambiental/socioambiental-criteria-catalog.ts` alimenta os 3 relatórios. Tabela legível: [`EXTRATO-SOCIOAMBIENTAL-CRITERIOS.md`](./EXTRATO-SOCIOAMBIENTAL-CRITERIOS.md).

### Bloco A — Cadastro e território

- Metadados propriedade/operação (SICAR ou formulário).
- **Histórico CAR** (essencial).
- Cruzamento bioma (% ha).

### Bloco B — Agente (listas)

- Trabalho escravo (MTE).
- Embargos IBAMA / ICMBio **lista** e **polígono**.
- Autuações IBAMA.
- Reserva Legal por documento.
- Restrição por beneficiário (CPR).

### Bloco C — Desmatamento

- MapBiomas Alerta (+ proximidade → Alerta).
- PRODES Cerrado / MA / AL (anual ou agregado).

### Bloco D — Áreas protegidas e comunidades

- UC, APA, ARIE, reservas particulares.
- TI homologada / não homologada.
- Quilombolas, assentamentos reforma agrária.
- Variantes buffer 3 km → **Alerta**.

### Bloco E — Patrimônio

- Sítios arqueológicos IPHAN (+ buffer → Alerta).

### Bloco F — Contexto MG (opcional)

- APP, outorgas, licenciamento (camadas Wave A atuais).

Cada critério: `id`, `label`, `tipoConsulta`, `fonte`, `bloqueante`, `modosRelatorio[]`, `ufsAplicaveis`.

## 7. Os três relatórios

### Extrato Socioambiental

1. Informações do território/operação + agentes.
2. Matriz critérios × semáforo.
3. Detalhes (Inapto + Alertas).
4. Textos descritivos dos critérios.
5. **Mapa:** território + camadas Inapto (vermelho) + Alerta (amarelo).
6. Tabela de fontes.
7. Disclaimer consultoria.

### Extrato Risco Socioambiental

1. Cabeçalho operação (CPR, cooperativa — opcional).
2. Cheque por documento (escravo, embargo lista).
3. Por geometria (gleba + imóvel): bioma; tabela Tipo | Sobreposição | Proximidade | Resultado.
4. Detalhes dos riscos.
5. Imóvel: SICAR + **histórico CAR**.
6. Veredito global.
7. Tabela de referência (URL + data).

### Extrato completo

- Secção 1: matriz (Socioambiental).
- Secção 2: tabelas por geometria (Risco).
- Secção 3: alertas deduplicados (`tipoRisco + codigoAlerta`).
- Secção 4: histórico CAR (só imóvel).
- Um mapa, uma tabela de fontes.
- Parecer IA opcional (anexo).

## 8. Presets de atividade

| Preset | Perímetro | Critérios sugeridos |
|--------|-----------|---------------------|
| `mg_padrao` | CAR ou polígono | B+C+D essenciais |
| `credito_rural` | CAR + glebas | Completo protocolo crédito |
| `empreendimento_geral` | Polígono operação | B+C+D sem CAR obrigatório |
| `protocolo_personalizado` | Qualquer | Usuário marca checkboxes |

## 9. Arquitetura técnica (alvo)

```
src/lib/socioambiental/
  criteria-catalog.ts      # catálogo fechado
  run-pacote.ts            # orquestração
  regras-criterio.ts       # Apto/Alerta/Inapto
  proximidade.ts
  buffers.ts
  historico-car.ts
  listas-agente.ts         # MTE, IBAMA lista, RL
  merge-relatorio.ts       # completo sem redundância
  export-extrato-socioambiental-pdf.ts
  export-extrato-risco-pdf.ts
  export-extrato-completo-pdf.ts
  criterio-resultado-display.ts  # cores UI/PDF
```

Firestore `analisesSocioambientais`: `modoRelatorio`, `vereditoGlobal`, `glebas[]`, `resumoCriterios`, etc.

## 10. Fases de implementação

### Fase 0 — Spike histórico CAR ✅ (2026-06-11)

- **Conclusão:** WFS público só expõe snapshot atual (`sicar_imoveis_UF`). Sem camada de histórico.
- **Estratégia:** snapshots próprios no Firestore + comparação omissão (Fase 4).
- Ver [`EXTRATO-SOCIOAMBIENTAL-SPIKE-CAR.md`](./EXTRATO-SOCIOAMBIENTAL-SPIKE-CAR.md) e `npm run probe:sicar-historico`.

### Fase 1 — Fundação UI

- Wizard: modo relatório, PRODES, preset atividade, CAR opcional, N glebas.
- Tipo `Alerta` na UI e PDF (feito).
- Persistência campos novos.

### Fase 2 — Motor espacial MG+federal ✅

- ✅ INCRA (GML2), FUNAI WFS; proximidade; buffer 3 km → Alerta; PRODES por ano no mapeamento.
- ✅ PDF Extrato: mapa semáforo (vermelho/amarelo), veredito, modo relatório, tabela de fontes.
- ✅ IPHAN via PAMGIA ArcGIS (`loc_sitios_arqueologicos_iphan_p`) + buffer 3 km.

### Fase 3 — Listas agente ✅

- ✅ MTE Lista Suja + embargos IBAMA + autuações IBAMA + **ICMBio INDE WFS** (`cpf_cnpj`).
- ✅ Reserva Legal: condição cadastral SICAR por CAR confirmado.
- ✅ CPR: beneficiários (MTE/IBAMA/ICMBio) no wizard.

### Fase 4 — Risco + histórico CAR ✅ (2026-06-11)

- ✅ `risco-por-geometria.ts` — tabela sobreposição/proximidade/buffer por camada (imóvel + glebas).
- ✅ Wizard executa Wave A por gleba nos modos `extrato_risco_socioambiental` e `extrato_completo`.
- ✅ `RiscoGeometriaPanel` na UI; persistência `riscoPorGeometria` no Firestore.
- ✅ PDF dedicado (`export-extrato-risco-pdf.ts`); modo completo inclui anexo risco no PDF socio.
- Histórico CAR já integrado (snapshots + critério `car_historico_omissao`).

### Fase 5 — Completo + expansão UF ✅ (parcial, 2026-06-11)

- ✅ `merge-relatorio.ts` — alertas deduplicados (`tipoRisco + codigoAlerta`), PDF e UI.
- ✅ Extrato completo: ordem matriz → mapa → risco → alertas consolidados → histórico CAR → fontes.
- ✅ UF dinâmica no wizard a partir da localização CAR (`ufsAplicaveis` do catálogo).
- ✅ PDF externo: upload Firebase Storage (`socioambiental/{uid}/…`) ou URL manual → Firestore `pdfUrl`.
- Pendente: expansão Brasil além de `ufsAplicaveis`.

## 11. Estado atual (MVP)

- Hub com abas Extratos / Executar pacote.
- Blocos temáticos + stream filtrado Wave A.
- Apto/Inapto grosso (Alerta no tipo; lógica fina na Fase 2).
- PDF consolidado inicial; parecer IA opcional.

## 12. Próximos passos acordados

1. Conecta Gov para RL detalhada (quando credenciais disponíveis).
3. Expansão operacional fora de MG (pacote por UF).
