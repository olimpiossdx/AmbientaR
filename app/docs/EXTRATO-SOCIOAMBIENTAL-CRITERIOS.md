# Catálogo de critérios — Extrato Socioambiental

Referência legível do catálogo fechado em `src/lib/socioambiental/socioambiental-criteria-catalog.ts`.

Espelha o protocolo Sicoob/AgroTools (~50 critérios nomeados) e a tabela de risco Sicredi (sobreposição + proximidade).

## Semáforo

| Resultado | Significado |
|-----------|-------------|
| **Apto** | Sem restrição para o critério |
| **Alerta** | Buffer 3 km, proximidade ou cadastro — não bloqueia sozinho |
| **Inapto** | Sobreposição em critério bloqueante |
| **Não Analisado** | Fonte indisponível, fora do escopo UF ou Fase pendente |

## Regras fixas (v1 MG + federal)

- **Buffer 3 km** (UC, TI, quilombolas, assentamentos, IPHAN): sempre **Alerta**, nunca Inapto isolado.
- **Proximidade ≤ 3 km** (MapBiomas Alerta no Extrato Risco): **Alerta**.
- **Sobreposição** em embargo, PRODES, TI/UC/comunidades: **Inapto** quando `bloqueante: true`.

## Bloco A — Cadastro e território

| ID | Critério | Consulta | Fonte | Fase |
|----|----------|----------|-------|------|
| `car_sicar_imoveis` | Cadastro Rural (CAR/SICAR) | interseção | SICAR WFS | 1 |
| `car_app_hidrica` | APP hídrica (MapCAR) | interseção | IDE-Sisema MG | 1 |
| `car_historico_omissao` | Histórico CAR (omissão) | car_historico | Snapshots Firestore | 4 |
| `territorio_bioma_pct` | Cruzamento bioma (% ha) | metadado | mg_bioma | 2 |

## Bloco B — Agente (listas CPF/CNPJ)

Requer CPF/CNPJ do agente no passo 3 do wizard. API: `POST /api/socioambiental/listas-agente`.

| ID | Critério | Consulta | Fase | Status |
|----|----------|----------|------|--------|
| `mte_trabalho_escravo` | Trabalho escravo (MTE) | lista CSV MTE | 3 | ✅ |
| `ibama_embargo_lista` | Embargos IBAMA (lista) | PAMGIA `cpf_cnpj_i` | 3 | ✅ |
| `ibama_autuacoes_lista` | Autuações IBAMA | PAMGIA (autos) | 3 | ✅ |
| `icmbio_embargo_lista` | Embargos ICMBio (lista) | lista | 3 | Pendente |
| `reserva_legal_documento` | Reserva Legal (documento) | lista | 3 | Pendente |
| `restricao_beneficiario_cpr` | Restrição beneficiário CPR | lista | 3 | Pendente |

## Bloco C — Embargos (polígono)

| ID | Critério | Fonte | Fase |
|----|----------|-------|------|
| `ibama_embargo_poligono` | Embargos IBAMA | PAMGIA | 1 |
| `icmbio_embargo_poligono` | Embargos ICMBio | INDE | 1 |
| `sema_mt_embargo_poligono` | SEMA-MT | GeoServer MT | 5 (fora MG) |
| `ldi_pa_poligono` | LDI Pará | SEMAS-PA | 5 (fora MG) |

## Bloco D — Desmatamento

| ID | Critério | Modo PRODES | Fase |
|----|----------|-------------|------|
| `mapbiomas_alerta_intersecao` | MapBiomas Alerta (sobreposição) | — | 1 |
| `mapbiomas_alerta_proximidade` | MapBiomas Alerta (≤ 3 km) | — | 2 |
| `prodes_cerrado_YYYY` | PRODES Cerrado por ano | `por_ano` | 2 |
| `prodes_mata_atlantica_YYYY` | PRODES MA por ano | `por_ano` | 2 |
| `prodes_amazonia_legal_YYYY` | PRODES AL por ano (2008–2023) | `por_ano` | 2 |
| `prodes_*_agregado` | PRODES por bioma (agregado) | `agregado` | 2 |

Anos Cerrado/MA: 2018–2023. Amazônia Legal: 2008–2023.

## Bloco E — Áreas protegidas e comunidades

| ID | Critério | Tipo | Fase |
|----|----------|------|------|
| `uc_federal_pamgia` | UC federal (PAMGIA) | interseção | 1 |
| `uc_cnuc_mma` | UC CNUC (MMA) | interseção | 1 |
| `uc_estadual_mg` | UC estadual MG | interseção | 1 |
| `uc_apa` | APA | interseção | 2 |
| `uc_arie` | ARIE | interseção | 2 |
| `uc_reserva_particular` | RPPN | interseção | 5 |
| `icmbio_uc_federal` | UC ICMBio | interseção | 1 |
| `ti_homologada` | TI homologada | interseção | 2 |
| `ti_nao_homologada` | TI não homologada | interseção | 2 |
| `quilombolas_intersecao` | Quilombolas | interseção | 2 |
| `assentamentos_intersecao` | Assentamentos | interseção | 2 |
| `iphan_sitios_intersecao` | Sítios IPHAN | interseção | 2* |

\* WFS IPHAN público indisponível — **Não Analisado** até fonte alternativa.

## Bloco F — Buffers 3 km (sempre Alerta)

| ID | Critério | Fonte |
|----|----------|-------|
| `uc_buffer_3km` | UC — buffer 3 km | MMA CNUC |
| `ti_buffer_3km` | TI — buffer 3 km | FUNAI |
| `quilombolas_buffer_3km` | Quilombolas — buffer 3 km | INCRA |
| `assentamentos_buffer_3km` | Assentamentos — buffer 3 km | INCRA |
| `iphan_buffer_3km` | IPHAN — buffer 3 km | IPHAN* |

## Blocos opcionais MG

- **Recursos hídricos:** hidrografia, massas d'água, outorgas IGAM.
- **Contexto ambiental:** bioma, solos, geologia, fauna, ZEE, ICMS ecológico.
- **Licenciamento:** empreendimentos licenciados, licenciamento municipal.

## Camadas novas (Fase 2)

| layerId | Fonte | Formato |
|---------|-------|---------|
| `br_incra_assentamentos` | INCRA i3geo | WFS GML2 |
| `br_incra_quilombolas` | INCRA i3geo | WFS GML2 |
| `br_funai_ti_wfs` | FUNAI GeoServer | WFS JSON |
| `br_iphan_sitios` | IPHAN SICG | indisponível |

## Manutenção

Ao adicionar critério:

1. Entrada em `socioambiental-criteria-catalog.ts`
2. Linha nesta tabela
3. Camada em `wave-socioambiental-catalog.ts` ou catálogo Wave A/federal existente
4. Regra em `regras-criterio.ts` se lógica não for interseção/buffer/proximidade padrão
