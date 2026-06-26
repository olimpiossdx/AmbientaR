# Compensação Ambiental (MG / IEF) — Checklists e desenho do módulo

Documento de estudo para implementação no AmbientaR (**Estudos Técnicos → Compensação Ambiental**).  
Base: páginas do [IEF](https://www.ief.mg.gov.br/compensacao-ambiental), portarias citadas, [Res. CONAMA 369/2006](https://www.ief.mg.gov.br/documents/51853/7571120/RESOLU%25C3%2587%25C3%2583O_CONAMA_APP_-_n%25C2%25BA_369-2006/218f83f2-c780-a8dd-4caf-3bb524662f27), [DN COPAM 114/2008](https://www.ief.mg.gov.br/documents/51853/7571120/DELIBERA%25C3%2587%25C3%2583O_NORMATIVA_n%25C2%25BA_114-08_-_ISOLADAS_E_AMEA%25C3%2587ADAS/8627d96e-8d10-61e7-0d0d-87b7b0da759f), Res. Conj. SEMAD/IEF nº 3.102/2021.

---

## Decisões alinhadas (produto)

| # | Decisão |
|---|---------|
| 1 | **Ordem de implementação:** (1) Espécies protegidas/ameaçadas → (2) SNUC → (3) Mata Atlântica → (4) Minerária → (5) APP |
| 2 | **Planilhas/modelos IEF:** upload do **Word oficial** (.doc/.docx); app valida presença, versão e checklist; gera capa/índice/declarações auxiliares |
| 3 | **Um processo Firestore por tipo** de compensação (vínculos comuns: `projectId`, `requestId`, `piaId`, `seiIntervencao`, `seiCompensacao`) |
| 4 | **Checklist literal** por tipo (abaixo), com ordem sugerida para juntada no SEI |

---

## Arquitetura resumida (para código futuro)

```
Estudos Técnicos
└── Compensação Ambiental                    /studies/compensacao-ambiental
    ├── Espécies (protegidas / ameaçadas)    /studies/compensacao-ambiental/especies      [Fase 1]
    ├── SNUC                                 /studies/compensacao-ambiental/snuc          [Fase 2]
    ├── Mata Atlântica                       /studies/compensacao-ambiental/mata-atlantica [Fase 3]
    ├── Minerária                            /studies/compensacao-ambiental/mineraria     [Fase 4]
    └── Intervenção em APP                   /studies/compensacao-ambiental/app           [Fase 5]
```

**Coleção sugerida:** `compensacao_ambiental_processos`  
**Campos mínimos:** `tipo`, `status`, `vinculos`, `checklist[]`, `templatesIef[]` (upload Word), `documentosGerados[]`, `sei`.

**Integrações existentes:** PIA (`/studies/intervencao-ambiental`), PRADA (objetivos de compensação), checklist AIA (`f5_compensacao`), mapas (polígonos).

---

## Bloco comum — todo processo (antes do tipo)

| ID | Item | Obr. | Observação |
|----|------|------|------------|
| C01 | Cadastro usuário externo SEI!MG | Sim | [Manual usuário externo IEF](https://www.ief.mg.gov.br/compensacao-ambiental) |
| C02 | Habilitação SEI minerária (se aplicável) | Cond. | E-mail: `suportesei.ief@meioambiente.mg.gov.br` |
| C03 | Vínculo no AmbientaR: cliente / projeto / empreendimento | Sim | |
| C04 | Nº processo licenciamento ou intervenção (PA/SEI) | Sim | |
| C05 | Trecho da **condicionante** que impõe a compensação | Sim | Upload ou texto |
| C06 | Sinaflor (se houver supressão de vegetação nativa) | Cond. | Pré-requisito intervenção com supressão |
| C07 | Índice de juntada (gerado pelo app) | Sim | Ordem dos PDFs para peticionamento |
| C08 | Peticionamento intercorrente (complementação) | Cond. | Após devolução IEF |

**Portaria IEF 77/2020:** protocolo **100% digital** no SEI; processo incompleto é **devolvido** (prazo de complementação — ver notificação).

---

## 1. Espécies protegidas por lei e espécies ameaçadas (Fase 1 — prioridade)

**Normas principais:** Res. Conj. SEMAD/IEF **3.102/2021** (arts. 6, 16, 29); Decreto MG **47.749/2019** (arts. 26, 73); DN COPAM **114/2008** (árvores isoladas em MA); leis específicas (ipê, pequi, buriti, pau-brasil, etc.); Portaria MMA **443/2014**; orientação IEF sobre espécies protegidas.

**Tramite:** em regra no **processo de intervenção ambiental** (SEI URFBio / Semad), não processo SNUC separado. Compensação definida **antes** do DAIA quando cabível.

### 1.1 Formalização — intervenção com espécies (Res. 3.102/2021, art. 6)

| ID | Documento / estudo | Obr. | Condicional quando |
|----|------------------|------|---------------------|
| E01 | Requerimento intervenção ambiental (modelo IEF/Semad) | Sim | |
| E02 | RG/CPF + comprovante endereço — requerente | Sim | |
| E03 | RG/CPF + comprovante endereço — proprietário/possuidor | Sim | Disp. LAC/LAT: inc. II–IV art. 6 |
| E04 | Procuração + ID procurador | Cond. | |
| E05 | Certidão matrícula ou justa posse | Sim | |
| E06 | Recibo CAR | Sim | |
| E07 | Contrato locação/arrendamento/comodato | Cond. | Requerente ≠ proprietário |
| E08 | Carta de anuência | Cond. | Posse compartilhada / contrato sem autorização expressa |
| E09 | Planta topográfica PDF + vetorial + ART | Sim | TR IEF/Semad |
| E10 | PIA ou PIA simplificado + ART | Sim | Conforme área / supressão |
| E11 | **Proposta de medidas compensatórias** (espécies / MA / APP) | Sim | Art. 6, XI — **núcleo deste módulo** |
| E12 | DAE Taxa de Expediente | Sim | Info complementar: tipo e área |
| E13 | DAE Taxa Florestal | Cond. | Se houver produto florestal |
| E14 | Estudo **inexistência alternativa técnica e locacional** + ART | Cond. | APP ou supressão MA (art. 6 §4) |
| E15 | **Laudo técnico** (espécie ameaçada essencial à viabilidade) + ART | Cond. | Art. 6 §5 — alternativa locacional |
| E16 | Planilha Excel — árvores isoladas | Cond. | Corte/aproveitamento isoladas (art. 6 §6) |
| E17 | Cadastro Sinaflor | Cond. | Supressão vegetação nativa |

### 1.2 Flora ameaçada detectada (art. 16 Res. 3.102/2021)

| ID | Documento | Obr. | Observação |
|----|-----------|------|------------|
| E20 | Levantamento / inventário com espécies ameaçadas | Sim | |
| E21 | Proposta medidas **compensatórias e mitigadoras** | Sim | Conservação in situ |
| E22 | ART do responsável técnico | Sim | |

### 1.3 Quantitativo de compensação — mudas (art. 29 Dec. 47.749 / Res. 3.102)

| Categoria (Lista MMA) | Mudas por exemplar autorizado |
|----------------------|------------------------------|
| Vulnerável (VU) | 10 |
| Em perigo (EM) | 20 |
| Criticamente em perigo (CR) | 25 |
| Proteção especial (sem quantitativo na norma específica) | **10** (inc. I art. 29) |

| ID | Documento | Obr. |
|----|-----------|------|
| E30 | Memorial de cálculo de mudas por espécie/indivíduo | Sim |
| E31 | Projeto de plantio / compensação (local, espécies, cronograma) | Sim |
| E32 | ART | Sim |
| E33 | Declaração espécie enquadrada (lei específica ou MMA 443) | Sim |

### 1.4 Espécies com proteção legal específica (exemplos IEF)

| Espécie / grupo | Base legal (referência) |
|-----------------|-------------------------|
| Pau-brasil | Lei Federal 6.607/78 |
| Ipê-amarelo | Lei Estadual 9.743/88 |
| Pequizeiro | Lei Estadual 10.883/92 |
| Buriti | Lei Estadual 13.635/00 |
| Faveira-de-Wilson | Decreto Estadual 43.904/04 |
| Licuri | IN IBAMA 191/08 |
| Pinheiro | Decreto Estadual 46.602/14 |
| Lista oficial ameaçadas | Portaria MMA 443/14 |

| ID | Documento | Obr. |
|----|-----------|------|
| E40 | Laudo técnico justificando supressão (interesse social/utilidade pública/risco) | Cond. | Portaria IEF 191/2005 — árvores protegidas |
| E41 | Anuência Gerente de Núcleo (quando exigido) | Cond. | |
| E42 | **Alternativa locacional** (mapa + memorial) | Cond. | Checklist AIA `f5_alternativa_locacional` |

### 1.5 DN COPAM 114/2008 — árvores isoladas (Mata Atlântica)

Quando cabível: supressão de **exemplares isolados** fora de APP/RL em MA → TC de **Recuperação Ambiental** com plantio e/ou regeneração natural + tratos silviculturais; pode integrar cronograma PTRF.

| ID | Documento | Obr. |
|----|-----------|------|
| E50 | Proposta alinhada à DN 114/2008 | Cond. | |
| E51 | TC Recuperação Ambiental (modelo COPAM/IEF) | Cond. | Após aprovação |
| E52 | PTRF vinculado (se recuperação em área definida) | Cond. | |

### 1.6 Saída / pós-análise

| ID | Item | Obr. |
|----|------|------|
| E60 | Compensação como **condicionante** do DAIA (se sem TCCF) | Sim | Art. 27 § único Res. 3.102 |
| E61 | **TCCF** (se averbação em matrícula) | Cond. | Art. 27 |
| E62 | Pacote PDF/Word para anexar ao SEI da **intervenção** | Sim | Upload templates IEF |

**Templates Word (upload obrigatório — pasta configurável):** requerimento intervenção; planilha árvores isoladas; modelos proposta compensatória; laudos (conforme TR publicado no site IEF).

---

## 2. Compensação Ambiental SNUC (Fase 2)

**Base:** Art. 36 Lei Federal **9.985/2000**; Decretos **45.175/2009**, **45.629/2011**; Res. CONAMA **371/2006**; [Portaria IEF 55/2012](https://www.ief.mg.gov.br/w/compensacao-ambiental-snuc); Portaria IEF **77/2020** (SEI).

**Processo SEI:** `IEF – Processo de Compensação Ambiental SNUC`  
**Órgão:** GCARF → parecer único → **CPB/COPAM** → **TCCA** (+ PTCA se execução direta).

### 2.1 Identificação e enquadramento

| ID | Item | Obr. |
|----|------|------|
| S01 | Empreendimento com **impacto significativo** (EIA/RIMA ou equivalente estadual) | Sim |
| S02 | Condicionante de compensação SNUC na licença | Sim |
| S03 | Enquadramento: empreendimento implantado **antes** de 18/07/2000? | Sim | Define VCL vs VR |
| S04 | Pessoa jurídica ou física | Sim | |

### 2.2 Documentação — Portaria IEF 55/2012 (+ modelos no site IEF)

| ID | Documento | Obr. | Template Word IEF |
|----|-----------|------|-------------------|
| S10 | **Requerimento padrão** (Anexo Port. 55/2012) | Sim | Upload |
| S11 | **Declarações** padrão Port. 55/2012 | Sim | Upload |
| S12 | Documentos identificação empreendedor (PF: RG, CPF, endereço; PJ: CNPJ, IE, contrato social, representante) | Sim | |
| S13 | Procuração específica + ID procurador | Cond. | Upload modelo |
| S14 | Cópia **licença** com condicionante SNUC | Sim | |
| S15 | Cópia **parecer** licenciamento (PU/PT) + rol condicionantes | Sim | |
| S16 | Cópia estudos ambientais (EIA/RIMA, RCA, etc.) — referência impactos | Cond. | |
| S17 | **Planilha Valor de Referência (VR)** — ramo de atividade | Sim* | Upload planilha 01–26 |
| S18 | Justificativa de itens **zerados** na VR | Cond. | Dentro da planilha |
| S19 | Atualização valores — **tabela TJMG** até data envio | Sim | |
| S20 | ART + assinatura responsável técnico (VR/VCL) | Sim | |
| S21 | Assinatura **responsável pelo empreendimento** | Sim | |

\* Empreendimento anterior à Lei 9.985/2000: em vez de VR (ou se VCL inviável com justificativa):

| ID | Documento | Obr. | Condicional |
|----|-----------|------|-------------|
| S25 | **Valor Contábil Líquido (VCL)** — balanço patrimonial completo | Cond. | PJ pré-2000 |
| S26 | Memória de cálculo VCL + **Declaração VCL** | Cond. | |
| S27 | ART / Certidão regularidade contador | Cond. | |
| S28 | **VR** com justificativa de não apresentação VCL | Cond. | Alternativa admitida pelo órgão |
| S29 | PF pré-2000: VR investimento + **DITR** + comprovante entrega + memória | Cond. | Orientação IEF 26/04/2021 |

### 2.3 Planilhas VR por ramo (upload — manter atualizado pelo usuário)

| Código | Ramo (IEF) |
|--------|------------|
| VR01 | Aeroporto |
| VR02 | Aterro sanitário/industrial |
| VR03 | Barragens de rejeito |
| VR04 | Barragens saneamento/abastecimento |
| VR05 | Beneficiamento minerais / pedras ornamentais |
| VR06 | Biodiesel industrial |
| VR07 | Canalização |
| VR08 | Destilaria álcool / produção açúcar |
| VR09 | Distrito industrial |
| VR10 | Construção estradas novas |
| VR11 | Empreendimentos agrícolas e silviculturais |
| VR12 | Extração de areia |
| VR13 | Ferrovia |
| VR14 | Gasoduto |
| VR15 | Barragens reservatórios / hidrelétricos |
| VR16 | Indústria cimenteira |
| VR17 | Indústria em geral |
| VR18 | Indústria química / tratamento minérios |
| VR19 | Transformação de metais |
| VR20 | Linhas transmissão energia |
| VR21 | Mineração |
| VR22 | Mineração argila |
| VR23 | Parcelamento solo urbano |
| VR24 | Posto combustível |
| VR25 | Siderurgia e similares |
| VR26 | Suinocultura e bovinocultura |

### 2.4 Pós-protocolo SNUC

| ID | Item | Obr. |
|----|------|------|
| S40 | Parecer único GCARF submetido à **CPB** | — | Órgão |
| S41 | Aprovação valor, destinação e aplicação (CPB) | — | |
| S42 | **TCCA** assinado | Sim | Após aprovação |
| S43 | **PTCA** (se execução direta) | Cond. | |
| S44 | DAE / comprovante recolhimento (conforme TCCA) | Cond. | |
| S45 | Publicação extrato TCCA (DOE) | Cond. | |
| S46 | Status processo — painel IEF | Ref. | Link página SNUC |

---

## 3. Compensação Florestal Mata Atlântica (Fase 3)

**Base:** Lei **11.428/2006**; [Portaria IEF 30/2015](https://www.ief.mg.gov.br/w/compensacao-ambiental-florestal-mata-atlantica-em-unidades-de-conservacao); Instrução Serviço SISEMA 02/2017; CPB quando compensação em **UC estadual domínio público**.

**Local:** Escritório Regional IEF da base do **ato autorizativo** (intervenção).

### 3.1 Formalização (art. 1º Port. 30/2015)

| ID | Documento | Obr. | Condicional |
|----|-----------|------|-------------|
| M01 | **Requerimento** (Anexo I Port. 30/2015) | Sim | Upload Word |
| M02 | ID empreendedor (PF/PJ — igual bloco I portarias IEF) | Sim | |
| M03 | Procuração específica (assinatura **TCCF**) | Cond. | |
| M04 | Cópia licença e/ou **APEF/DAIA** com condicionante MA | Sim | **Dispensado** se LP sem PU/licença ainda (§1º) |
| M05 | Cópia **Parecer Único ou Técnico** (SUPRAM/NRRA/IEF) + condicionantes | Sim | **Dispensado** idem §1º |
| M06 | **PECF** conforme **Anexo II** (TR) | Sim | Upload / formulário espelho |

### 3.2 Medidas compensatórias (art. 2º Port. 30/2015 — escolha do empreendedor)

Registrar no processo qual modalidade:

| Modalidade | Resumo |
|------------|--------|
| I | Plantio espécies nativas análogas (mesma bacia, preferencial influência empreendimento) |
| II | Doação área em UC domínio público (regularização fundiária) |
| III | Recuperação área degradada em UC | Só se comprovada impossibilidade I e II |

| ID | Documento específico da modalidade | Obr. |
|----|-----------------------------------|------|
| M10 | Memorial escolha modalidade + justificativa impossibilidade I/II | Cond. | Se modalidade III |
| M11 | Polígonos área supressão / compensação (shapefile SIRGAS 2000 UTM) | Sim | |
| M12 | Planta planimétrica + ART | Sim | |
| M13 | Documentação imóvel doação (se II) | Cond. | |

### 3.3 Pós-análise

| ID | Item | Prazo / nota |
|----|------|----------------|
| M20 | Decisão **CPB/COPAM** | |
| M21 | **TCCF** | Máx. **60 dias** da decisão (art. 5º) |
| M22 | Publicação / cumprimento efetivo obrigações | Conforme TCCF |
| M23 | Processo SEI MA (se distinto do SNUC) | Um processo por tipo no app |

---

## 4. Compensação Florestal Minerária (Fase 4)

**Base:** Art. 75 Lei **20.922/2013**; [Portaria IEF 27/2017](https://www.ief.mg.gov.br/w/compensacao-ambiental-florestal-mineraria); Portaria IEF **77/2020**.

**Processo SEI:** `IEF – Processo de Compensação Minerária`  
**Tramite:** GCARF → **URFBio** do município da medida → parecer → **CPB** → **TCCFM**.

### 4.1 Formalização (art. 1º Port. 27/2017)

| ID | Documento | Obr. | Template |
|----|-----------|------|----------|
| N01 | **Requerimento** (Anexo I Port. 27/2017) | Sim | Upload Word |
| N02 | ID empreendedor (PF/PJ) | Sim | |
| N03 | Procuração (assinatura **TCCFM**) | Cond. | |
| N04 | Licença e/ou **APEF/DAIA/AIA** com condicionante minerária | Sim | |
| N05 | **PU** SUPRAM + condicionantes **ou** Parecer Técnico IEF (Anexo III) | Sim | Se desvinculado licenciamento |
| N06 | **PECFM** — TR **Anexo II** Port. 27/2017 | Sim | Upload Word |

### 4.2 Conteúdo PECFM (TR Anexo II — estrutura para checklist interno)

| Seção TR | Itens a marcar no app |
|----------|------------------------|
| 1–3 | Empreendedor, consultoria, equipe (ARTs) |
| 4 | Histórico licenças, DAIA, condicionantes compensação |
| 5 | Área intervinda (ADA): Quadro 1A (§2º art. 75) vs 1B (§1º); revalidação; LIC/LOC |
| 5.4 | Planta ADA + CD shapefile/kml; estudos; PU; licença |
| 6 | Modalidade compensação |

### 4.3 Modalidades (art. 2º Lei 20.922 / Port. 27)

| Modalidade | Descrição resumida |
|------------|-------------------|
| **Doação área UC** | Área ≥ supressão em UC Proteção Integral pendente regularização fundiária |
| **Implantação em UC** | Planos de Trabalho — IEF define UC final (§2º art. 62 Dec. 47.749) |

| ID | Documento | Obr. | Cond. |
|----|-----------|------|-------|
| N10 | Planta planimétrica ADA + declaração responsável legal | Sim | |
| N11 | CD poligonais (kml + shapefile, SIRGAS 2000 UTM) | Sim | |
| N12 | **Declaração Gerente UC** (Anexo A Port. 27) | Cond. | Doação em UC existente |
| N13 | Documentação imóvel (matrícula, ITR 5 anos, IPTU se urbano, ônus) | Cond. | Doação |
| N14 | Contato / proposta UC sugerida | Recom. | Implantação |
| N15 | Regime **Lei 14.309/2002** (regularização antes 17/10/2013) | Cond. | Área ≥ ocupação; mesma bacia |

### 4.4 Pós-análise

| ID | Item |
|----|------|
| N20 | Parecer URFBio → CPB |
| N21 | **TCCFM** |
| N22 | Peticionamento intercorrente (complementação) |

**Nota:** Compensação minerária é **cumulativa** com SNUC e demais — processos **separados** no app.

---

## 5. Compensação por intervenção em APP (Fase 5)

**Base:** [Res. CONAMA 369/2006](https://www.ief.mg.gov.br/documents/51853/7571120/RESOLU%25C3%2587%25C3%2583O_CONAMA_APP_-_n%25C2%25BA_369-2006/218f83f2-c780-a8dd-4caf-3bb524662f27); [SEMAD — Compensações por intervenções](https://semad.mg.gov.br/w/compensacoes-por-intervencoes-ambientais); Res. Conj. SEMAD/IEF **3.102/2021** (arts. 6, 27, 28).

**Momento:** proposta **antes** da emissão do DAIA.  
**Área mínima:** **1×1** (compensação ≥ área intervenção).

### 5.1 Formalização no SEI da intervenção (URFBio)

| ID | Documento | Obr. | Condicional |
|----|-----------|------|-------------|
| A01 | **Proposta compensação APP** no processo SEI da intervenção | Sim | Art. 6 XI Res. 3.102 |
| A02 | Estudo **inexistência alternativa técnica e locacional** + ART | Cond. | Intervenção em APP com supressão |
| A03 | Memorial área intervenção APP (ha) + polígonos | Sim | |
| A04 | Memorial área compensação (ha) ≥ intervenção | Sim | Regra 1×1 |

### 5.2 Formas de compensação (escolha — CONAMA 369 + orientação SEMAD)

| Opção | Descrição |
|-------|-----------|
| **I** | Recuperação APP mesma **sub-bacia** (prioritário: influência empreendimento / cabeceiras) |
| **II** | Recuperação área degradada em **UC** domínio público (federal/estadual/municipal em MG) |
| **III** | Outras previstas na norma / análise caso a caso |

| ID | Documento | Obr. | Se opção I |
|----|-----------|------|------------|
| A10 | **Projeto Técnico Reconstituição da Flora (PTR)** + ART | Cond. | Sim |
| A11 | TR PTR IEF (modelo site) | Cond. | Upload Word |
| A12 | **Declaração ciência e aceite** proprietário/posseiro | Cond. | Compensação em terceiros |
| A13 | Documentação propriedade/posse imóvel compensação | Cond. | Terceiros |
| A14 | Planta + shapefile área recuperação | Sim | |
| A15 | Cronograma físico recuperação | Sim | |

### 5.3 Encerramento

| ID | Item |
|----|------|
| A20 | Aprovação no processo de **intervenção** |
| A21 | **TCCF** (se averbação matrícula) ou condicionante no DAIA |
| A22 | Vincular PRADA no AmbientaR se `objetivo = compensacao_app` |

---

## Ordem de juntada sugerida no SEI (por tipo)

### Espécies / intervenção
1. Requerimento → 2. Identificação → 3. Imóvel/CAR → 4. PIA → 5. Proposta compensatória → 6. Laudos/planilhas → 7. DAEs → 8. ART/declarações

### SNUC
1. Requerimento → 2. Declarações → 3. Identificação → 4. Licença + parecer → 5. VR ou VCL + memória → 6. ART → 7. Anexos estudos

### Mata Atlântica / Minerária
1. Requerimento → 2. Identificação → 3. Ato autorizativo + parecer → 4. PECF/PECFM → 5. Plantas/CD → 6. Documentos modalidade (doação/UC)

### APP
1. Dentro do processo intervenção: proposta → PTR (se I) → polígonos → aceite terceiros → DAEs

---

## Mapeamento para implementação (`checklist` JSON)

Cada item acima vira:

```ts
{
  id: "E11",
  label: "Proposta de medidas compensatórias",
  required: true,
  phase: "formalizacao",
  source: "Res. SEMAD/IEF 3102/2021 art. 6 XI",
  templateSlot: null | "proposta_compensatoria", // upload Word IEF
  generatesPdf: true,
  seiOrder: 5,
}
```

**Status do item:** `pendente` | `upload_ok` | `gerado` | `protocolado`  
**% conclusão:** itens obrigatórios preenchidos / total obrigatórios.

---

## Referências rápidas

| Tema | Link |
|------|------|
| Hub IEF | https://www.ief.mg.gov.br/compensacao-ambiental |
| SNUC | https://www.ief.mg.gov.br/w/compensacao-ambiental-snuc |
| Mata Atlântica | https://www.ief.mg.gov.br/w/compensacao-ambiental-florestal-mata-atlantica-em-unidades-de-conservacao |
| Minerária | https://www.ief.mg.gov.br/w/compensacao-ambiental-florestal-mineraria |
| CONAMA 369 APP | https://www.ief.mg.gov.br/documents/51853/7571120/RESOLU%25C3%2587%25C3%2583O_CONAMA_APP_-_n%25C2%25BA_369-2006/218f83f2-c780-a8dd-4caf-3bb524662f27 |
| DN 114/2008 | https://www.ief.mg.gov.br/documents/51853/7571120/DELIBERA%25C3%2587%25C3%2583O_NORMATIVA_n%25C2%25BA_114-08_-_ISOLADAS_E_AMEA%25C3%2587ADAS/8627d96e-8d10-61e7-0d0d-87b7b0da759f |
| Intervenções SEMAD | https://semad.mg.gov.br/w/compensacoes-por-intervencoes-ambientais |

---

*Última atualização: estudo inicial — validar anexos das Portarias 55 e 27 com download direto do site IEF antes de codificar validações automáticas.*
