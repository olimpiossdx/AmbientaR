# MVP — Camadas IDE-Sisema / GeoServer MG (Etapa 1)

Lista acordada para consulta no ecossistema **IDE-Sisema** (Minas Gerais), via **GeoServer** e metadados no **GeoNetwork** — sem replicar login do SISEMANET/Geosisemanet na aplicação.

> **WFS (confirmado 2026-05-22):** usar `https://geoserver.meioambiente.mg.gov.br/ows` — **não** `/geoserver/ows` (404). Workspace: **`IDE:`** (maiúsculas). Código: `src/lib/geospatial/wave-a-catalog.ts`.

---

## Tabela typeName confirmada (GetCapabilities)

| Card (UI) | layerId | typeName WFS (principal) | Geometria |
|-----------|---------|--------------------------|-----------|
| Hidrografia | `mg_hidrografia` | `IDE:ide_0104_mg_hidrografia_principal_lin` (+ fallback `ide_240902_mg_rios_duplos_fbds_lin`) | linha |
| Bioma | `mg_bioma` | `IDE:ide_0302_mg_limite_biomas_ibge_pol` | polígono |
| Solos | `mg_solos` | `IDE:ide_1502_mg_mapa_solos_pol` | polígono |
| Geologia | `mg_geologia` | `IDE:ide_1701_mg_mapa_geologico_pol` | polígono |
| Geomorfologia | `mg_geomorfologia` | `IDE:ide_0203_mg_unid_geomorfologicas_pol` | polígono |
| Pedologia | `mg_pedologia` | `IDE:ide_2401_mg_mapa_pedologico_simplificado_pol` | polígono |
| Vegetação | `mg_inventario_florestal` | `IDE:ide_0301_mg_cobertura_florestal__2009_pol` | polígono |
| Fauna | `mg_fauna` | `IDE:ide_1801_mg_ocorrencia_especies_pto` | ponto |

**Nota bioma:** MapBiomas col.9 **não** listado no GetCapabilities deste GeoServer; usamos limites IBGE MG (equivalente temático no painel “bioma”).

**Nota hidrografia:** massas d’água FBDS (`ide_240904_mg_massas_dagua_fbds_pol`) podem ser card extra futuro (polígono).

---

## Camadas escolhidas para o MVP (entrada do utilizador)

| # | Tema | Uso no relatório / estudo |
|---|------|---------------------------|
| 1 | **Hidrografia** | APP, drenagem, corpos d’água, % sobre o empreendimento |
| 2 | **Solos** | Classes de solo, aptidão, restrições agrícolas |
| 3 | **Bioma** | Contexto fitogeográfico (Cerrado, Mata Atlântica, etc.) |
| 4 | **Inventário florestal** | Cobertura/floresta, remanescentes, fitofisionomia onde disponível |
| 5 | **Geologia** | Unidades litológicas, litologia |
| 6 | **Geomorfologia** | Unidades geomorfológicas, processos |
| 7 | **Pedologia** | Unidades pedológicas (pode complementar “solos”) |
| 8 | **Fauna** | Ocorrências / áreas sensíveis (geralmente pontos ou polígonos de registos) |

---

## Onde descobrir o nome técnico de cada camada

1. **GeoNetwork IDE-Sisema:** `https://idesisema.meioambiente.mg.gov.br/geonetwork` — pesquisar por palavra-chave (ex. “hidrografia”, “pedologia”).
2. **GeoServer capabilities:** `https://geoserver.meioambiente.mg.gov.br/` — `GetCapabilities` WFS: listar `FeatureType`.
3. **Geoportal webservices:** `https://geoportal.meioambiente.mg.gov.br/webservices` — ligações OGC.
4. **Validação humana:** abrir a mesma área no visualizador Geosisemanet e comparar classes com o nosso PDF.

Preencher na implementação uma tabela `geo_layer_catalog` com colunas:

`id`, `titulo`, `layerName` (confirmado), `crs`, `campoLegenda`, `geometryType`, `ativo`, `ordemRelatorio`.

---

## Decisão de prioridade (2026-05-21)

**Implementar agora:** só **Onda A**. Etapa 2 (IA) só após PDF Onda A validado. Ondas B e C ficam em fila.

Plano executivo: [PLANO-ONDA-A-E-ETAPA-2.md](./PLANO-ONDA-A-E-ETAPA-2.md).

---

## Recomendação: ondas dentro da Etapa 1 (não fazer 8 de uma vez)

Implementar por **ondas** reduz risco de timeout WFS e facilita validar % com o visualizador oficial.

### Onda A — valor imediato (licenciamento + APP)

| Camada | Prioridade | Motivo |
|--------|------------|--------|
| Hidrografia | P0 | APP, EIA/RCA, alertas regulatórios |
| Bioma | P0 | Contexto obrigatório em quase todos os estudos MG |
| Solos | P1 | Descrição pedológica / aptidão |

### Onda B — meio físico (texto Etapa 2)

| Camada | Prioridade | Motivo |
|--------|------------|--------|
| Geologia | P1 | Base para meio físico |
| Geomorfologia | P1 | Complementa geologia; evitar redundância no texto IA |
| Pedologia | P2 | Pode sobrepor “solos” — ver nota abaixo |

### Onda C — meio biótico (mais complexo no WFS)

| Camada | Prioridade | Motivo |
|--------|------------|--------|
| Inventário florestal | P2 | Polígonos grandes; muitas feições → worker ou limite de features |
| Fauna | P3 | Muitas vezes pontos esparsos; relatório por **ocorrência/proximidade**, não só % área |

**MVP “apresentável” em PDF:** Onda A completa + pelo menos **uma** de geologia ou geomorfologia.

**MVP “lista completa” do utilizador:** Ondas A+B+C, com expectativa de prazo maior.

---

## Notas técnicas por camada

### Hidrografia

- **Geometria esperada:** linhas (cursos) e eventualmente polígonos (massas d’água).
- **Métrica principal:** comprimento de curso no empreendimento + % da área em massa d’água / buffer de APP (se política interna definir buffer fixo, documentar no relatório).
- **Campo legenda sugerido:** nome do curso, ordem, tipo (perene/intermitente) — conforme atributos da camada.
- **Risco:** linhas muito fragmentadas → agregar por nome ou por bacias.

### Solos vs Pedologia

- Em MG costumam existir **camadas distintas** (mapa de solos vs unidades pedológicas).
- **Recomendação:** tratar como **duas entradas no catálogo**, mas no PDF agrupar secção “Meio físico — solo e pedologia”.
- Na Etapa 2, instruir a IA a **não duplicar** parágrafos: pedologia = unidades; solos = classes/agrupamento.

### Bioma

- Pode ser polígono regional (baixa resolução) → % do empreendimento em cada bioma costuma ser **100% de uma classe** ou divisão simples.
- Validar se a camada é MapBiomas estadual ou oficial MG no catálogo.

### Inventário florestal

- Polígonos de vegetação / floresta; pode intersectar fortemente com APP e RL (não confundir com CAR).
- **Métrica:** % área por classe de vegetação / fitofisionomia (atributo a confirmar no WFS).
- **Performance:** se `GetFeature` retornar > N feições, usar BBOX + simplificação ou processamento no worker.

### Geologia e Geomorfologia

- Polígonos de unidades; **% por unidade** dentro do empreendimento é a métrica certa.
- **Texto IA (Etapa 2):** geologia = litologia/estrutura; geomorfologia = relevo/processos — secções separadas no complemento.

### Fauna

- Frequentemente **pontos** (registros) ou polígonos de áreas de importância.
- **Métrica recomendada no MVP:**
  - contagem de registos dentro do perímetro;
  - distância mínima ao perímetro;
  - opcional: % do empreendimento apenas se a camada for poligonal.
- Card no PDF: mapa com pontos + tabela “espécie / grupo / fonte” (se atributos existirem).
- **Não forçar % de área** como nas outras camadas se a fonte for pontual.

---

## Entradas de dados do utilizador (Etapa 1)

Manter o conjunto já previsto na app; ordem de preferência para **qualidade da análise**:

| Entrada | Adequação para as 8 camadas |
|---------|------------------------------|
| **Polígono desenhado / KML / SHP** | Melhor — perímetro explícito |
| **CAR** | Bom — atributos SICAR + geometria quando API/GeoServer permitir |
| **Coordenada única** | Fraco para % — usar buffer mínimo (ex. 50 m ou 1 ha) só se o produto aceitar e **rotular** no PDF |

**Recomendação:** no MVP, exigir polígono (ou CAR com geometria) para gerar PDF completo; coordenada só para consulta rápida sem % oficial.

---

## Estrutura de cada card no PDF (Etapa 1)

Para camadas poligonais (1–7):

- Título + fonte IDE-Sisema + data UTC
- Mini-mapa (perímetro + camada recortada)
- Tabela: classe | área (ha) | **% do empreendimento**
- Linha “Área total do empreendimento: X ha”

Para fauna (8):

- Mini-mapa com pontos/ocorrências
- Tabela: identificação | distância (m) | dentro/fora
- Nota metodológica no rodapé

---

## Ligação à Etapa 2 (Relatórios de IA)

| Camada Etapa 1 | Secção sugerida no complemento IA |
|----------------|-----------------------------------|
| Hidrografia | Hidrografia e APP |
| Solos + Pedologia | Solo e pedologia (unificar redação) |
| Bioma + Inventário florestal | Vegetação e fitofisionomia |
| Geologia + Geomorfologia | Meio físico — geologia e relevo |
| Fauna | Meio biótico — fauna |

A IA recebe `layers[].stats` — não reconsulta WFS na Etapa 2 (recomendado).

---

## Checklist antes de marcar uma camada como “pronta”

- [ ] `layerName` WFS confirmado no GeoNetwork
- [ ] CRS e reprojeção testados com polígono em MG
- [ ] % validado manualmente vs Geosisemanet em 1 polígono teste
- [ ] Timeout e limite de feições documentados
- [ ] Entrada no catálogo `geo_layer_catalog` com `ordemRelatorio`
- [ ] Card e página PDF com mesma tabela

---

## Próximo passo de refinamento (discussão)

Sessão futura: preencher coluna **`layerName` confirmado** para cada uma das 8 camadas após pesquisa no GeoNetwork (pode ser tarefa manual de 1–2 h com documentação exportada).

---

## Histórico

- 2026-05-21: lista de 8 camadas IDE-Sisema MG + ondas A/B/C + métricas por tipo de geometria.
