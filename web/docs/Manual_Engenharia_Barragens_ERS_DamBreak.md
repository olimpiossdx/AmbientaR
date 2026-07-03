
# MANUAL TÉCNICO DE ENGENHARIA DE BARRAGENS E BARRAMENTOS  
## + Documento de Requisitos de Software (ERS) para Automação de Estudos, Projetos, Memoriais, Outorga e Dam Break

**Versão:** 1.0  
**Finalidade:** especificação técnica para orientar engenheiros, projetistas e desenvolvedores na criação de uma plataforma capaz de receber dados de campo e gerar automaticamente relatórios técnicos, memoriais de cálculo, estudos hidrológicos, hidráulicos, geotécnicos, segurança de barragens, outorga e plano/estudo de ruptura hipotética (Dam Break).  
**Uso pretendido:** barragens de acumulação de água, barramentos com e sem regularização de vazão, diques, soleiras, pequenos reservatórios rurais, estruturas de captação, travessias hidráulicas e obras associadas.

> **Aviso técnico e legal:** este manual é uma estrutura de engenharia e requisitos de software. Não substitui projeto executivo assinado por profissional habilitado, ART/RRT, validação em campo, outorga, licenciamento ambiental, aprovação do órgão competente, inspeções, instrumentação e atendimento a normas federais, estaduais e municipais.

---

# 0. BASES TÉCNICAS, NORMATIVAS E REFERENCIAIS

## 0.1 Fontes normativas e técnicas consideradas

Este manual foi estruturado com base em diretrizes técnicas nacionais e internacionais, incluindo:

1. **Lei Federal nº 12.334/2010**, que estabelece a Política Nacional de Segurança de Barragens (PNSB) e cria o Sistema Nacional de Informações sobre Segurança de Barragens (SNISB).
2. **Lei Federal nº 14.066/2020**, que alterou a PNSB e reforçou dispositivos de segurança, emergência e responsabilidade.
3. **Resolução ANA nº 236/2017**, que estabelece conteúdo mínimo, periodicidade, qualificação técnica e nível de detalhamento do Plano de Segurança da Barragem (PSB), Inspeções de Segurança Regular e Especial, Revisão Periódica de Segurança e Plano de Ação de Emergência (PAE), para barragens fiscalizadas pela ANA.
4. **Resolução CNRH nº 143/2012**, que estabelece critérios gerais de classificação de barragens por Categoria de Risco (CRI), Dano Potencial Associado (DPA) e volume do reservatório.
5. **Manuais do Empreendedor sobre Segurança de Barragens da ANA**, incluindo orientações para projeto, construção, operação, inspeção, revisão periódica e PAE.
6. **Termos de Referência do IGAM/MG** para processos de outorga, incluindo barramento sem regularização, barramento com regularização menor que 5 ha, barramento com regularização maior que 5 ha, barramento sem captação e barramento sem captação para regularização.
7. **HEC-RAS/USACE**, para modelagem hidráulica, análise de rompimento de barragens, escoamento não permanente 1D/2D e propagação de onda de cheia.
8. **FEMA P-946**, referência internacional para mapeamento de inundação associado a incidentes e falhas de barragens, com aplicação em planos de emergência.

## 0.2 Estrutura do documento

O documento está dividido em duas grandes partes:

- **Parte A — Manual Técnico de Engenharia:** descreve estudos, cálculos, dimensionamentos, verificações, relatórios e memoriais.
- **Parte B — ERS — Documento de Requisitos de Software:** descreve como transformar os estudos em um sistema automatizado com entrada de dados, regras de validação, banco de dados, módulos de cálculo, geração de documentos e integração com QGIS, HEC-RAS, HEC-HMS e ferramentas CAD/GIS.

---

# PARTE A — MANUAL TÉCNICO DE ENGENHARIA

---

# 1. CLASSIFICAÇÃO DAS ESTRUTURAS

## 1.1 Barragem com regularização de vazão

Estrutura implantada em curso d'água, talvegue ou área de acumulação, destinada a formar reservatório com volume útil capaz de armazenar água em períodos de maior disponibilidade e liberar vazão durante períodos de estiagem.

### Finalidades típicas

- Irrigação.
- Abastecimento humano.
- Dessedentação animal.
- Aquicultura.
- Uso industrial.
- Paisagismo.
- Regularização ambiental de vazões.
- Controle de cheias, quando projetada para esse fim.
- Reservação estratégica.

### Estudos obrigatórios recomendados

- Topografia.
- Hidrologia.
- Balanço hídrico.
- Regularização de vazão.
- Curva cota-área-volume.
- Geotecnia.
- Projeto hidráulico.
- Projeto estrutural/geotécnico.
- Estabilidade.
- Vertedouro.
- Tomada d'água.
- Descarga de fundo.
- Drenagem interna.
- Segurança de barragem.
- Outorga.
- Licenciamento ambiental.
- Operação e manutenção.
- Dam Break, quando aplicável.

---

## 1.2 Barramento sem regularização de vazão

Estrutura implantada no curso d'água com objetivo de elevar nível, direcionar captação, estabilizar leito, permitir travessia ou controlar pequeno desnível, sem volume útil relevante para regularização sazonal.

### Exemplos

- Soleira de nível.
- Pequeno barramento galgável.
- Travessia hidráulica.
- Dique transversal.
- Estrutura de derivação.
- Barramento para captação direta.
- Barramento de pequena lâmina d'água.

### Estudos obrigatórios recomendados

- Topografia local.
- Perfil longitudinal do curso d'água.
- Seções transversais.
- Hidrologia de cheia.
- Hidráulica da soleira.
- Remanso.
- Velocidade e erosão.
- Proteção de margens.
- Dissipação de energia.
- Verificação de estabilidade.
- Outorga/licenciamento.

---

## 1.3 Tipos construtivos

### Barragem de terra homogênea

Maciço constituído predominantemente por solo compactado relativamente homogêneo. Exige controle rigoroso de compactação, umidade, drenagem interna e proteção contra erosão.

### Barragem de terra zonada

Maciço dividido em zonas com funções específicas:

- Núcleo impermeável.
- Espaldares.
- Filtros.
- Transições.
- Drenos.
- Proteção de taludes.

### Barragem de enrocamento

Estrutura composta por blocos rochosos, normalmente com núcleo impermeável ou face impermeável. Apresenta alta permeabilidade nos espaldares e boa estabilidade, mas exige controle de transições e deformações.

### Barragem de concreto gravidade

Estrutura rígida que resiste ao empuxo da água pelo peso próprio. Exige verificação de tombamento, deslizamento, tensões na base e subpressão.

### Barragem de concreto compactado a rolo (CCR)

Variante de concreto com execução em camadas compactadas, aplicada a estruturas de maior porte.

---

# 2. FLUXO GERAL DE ELABORAÇÃO DO PROJETO

## 2.1 Etapas

1. **Levantamento preliminar**
   - Localização.
   - Finalidade.
   - Titularidade.
   - Curso d'água.
   - Acessos.
   - Restrições ambientais.

2. **Cadastro do empreendimento**
   - Dados do proprietário.
   - Dados do imóvel.
   - Coordenadas.
   - Município.
   - Bacia hidrográfica.

3. **Levantamento topográfico**
   - MDT.
   - Curvas de nível.
   - Perfil longitudinal.
   - Seções transversais.
   - Curva cota-área-volume.

4. **Estudo hidrológico**
   - Área da bacia.
   - Chuva de projeto.
   - Vazões mínimas.
   - Vazões médias.
   - Vazões máximas.

5. **Estudo de demanda**
   - Irrigação.
   - Abastecimento.
   - Dessedentação.
   - Aquicultura.
   - Usos múltiplos.

6. **Balanço hídrico**
   - Afluências.
   - Demandas.
   - Evaporação.
   - Infiltração.
   - Vertimento.
   - Volume útil.

7. **Dimensionamento hidráulico**
   - Vertedouro.
   - Canal de descarga.
   - Tomada d'água.
   - Descarga de fundo.
   - Dissipador.

8. **Estudo geotécnico**
   - Fundação.
   - Materiais de empréstimo.
   - Permeabilidade.
   - Resistência.
   - Compactação.

9. **Dimensionamento do maciço**
   - Altura.
   - Largura de crista.
   - Taludes.
   - Núcleo.
   - Drenos.
   - Filtros.

10. **Análises de estabilidade**
    - Final de construção.
    - Reservatório cheio.
    - Rebaixamento rápido.
    - Sismo, quando aplicável.

11. **Segurança**
    - Classificação.
    - Inspeções.
    - PSB.
    - PAE.
    - Dam Break, quando aplicável.

12. **Documentação**
    - Memorial descritivo.
    - Memorial de cálculo.
    - Plantas.
    - Relatório fotográfico.
    - ART.
    - Outorga.
    - Licenciamento.

---

# 3. LEVANTAMENTO TOPOGRÁFICO

## 3.1 Objetivos

O levantamento topográfico deve fornecer base geométrica para:

- Definir eixo da barragem.
- Definir cota da fundação.
- Definir cota da crista.
- Delimitar reservatório.
- Determinar área inundada.
- Calcular volume acumulado.
- Gerar seção típica.
- Gerar perfis.
- Avaliar área de APP.
- Avaliar interferências.

## 3.2 Dados mínimos

| Dado | Unidade | Descrição |
|---|---:|---|
| Coordenadas do eixo | UTM/SIRGAS 2000 | Pontos do eixo da barragem |
| Cota do talvegue | m | Cota mínima no eixo |
| Cotas das margens | m | Apoios laterais |
| Curvas de nível | m | Preferencialmente equidistância de 0,5 m a 2,0 m |
| Seções transversais | m | Ao longo do eixo e jusante/montante |
| Perfil longitudinal | m | Curso d'água e eixo hidráulico |
| Área inundada | m²/ha | Por cota |
| Volume acumulado | m³ | Por cota |

## 3.3 Curva cota-área-volume

A curva cota-área-volume é base para regularização, definição do nível normal, volume morto, volume útil, volume de espera e nível máximo.

### Fórmula do volume entre duas cotas

\[
V_i = \frac{A_i + A_{i+1}}{2} \cdot \Delta h
\]

Onde:

- \(V_i\) = volume parcial entre duas cotas, m³.
- \(A_i\) = área inundada na cota inferior, m².
- \(A_{i+1}\) = área inundada na cota superior, m².
- \(\Delta h\) = diferença de cota, m.

### Volume acumulado

\[
V_{acum,n} = \sum_{i=1}^{n} V_i
\]

### Tabela de memorial

| Cota (m) | Área (m²) | Área (ha) | Δh (m) | Volume parcial (m³) | Volume acumulado (m³) |
|---:|---:|---:|---:|---:|---:|
| C0 | A0 | A0/10000 | - | - | 0 |
| C1 | A1 | A1/10000 | C1-C0 | ((A0+A1)/2)×Δh | V1 |
| C2 | A2 | A2/10000 | C2-C1 | ((A1+A2)/2)×Δh | V1+V2 |

## 3.4 Requisitos para automação

O sistema deve permitir:

- Importar arquivos DXF, DWG, SHP, GeoJSON, KML, CSV e raster DEM.
- Calcular automaticamente áreas inundadas por cota.
- Gerar tabela cota-área-volume.
- Gerar gráfico cota-volume.
- Gerar gráfico cota-área.
- Exportar resultados para Markdown, PDF, XLSX, DXF e GeoPackage.

---

# 4. ESTUDO HIDROLÓGICO

## 4.1 Objetivo

Determinar vazões mínimas, médias e máximas necessárias para:

- Avaliar disponibilidade hídrica.
- Dimensionar reservatório.
- Dimensionar vertedouro.
- Dimensionar canal de descarga.
- Dimensionar tomada d'água.
- Avaliar risco de galgamento.
- Calcular propagação de cheia.
- Alimentar estudo de Dam Break.

## 4.2 Delimitação da bacia hidrográfica

### Dados

| Variável | Símbolo | Unidade |
|---|---:|---:|
| Área da bacia | A | km² |
| Comprimento do talvegue | L | km |
| Cota de nascente ou divisor | Cmax | m |
| Cota da seção de barramento | Cmin | m |
| Desnível | H | m |
| Declividade média | S | m/m |

### Cálculo do desnível

\[
H = C_{max} - C_{min}
\]

### Declividade média

\[
S = \frac{H}{L \cdot 1000}
\]

## 4.3 Tempo de concentração

Um método preliminar comum é a fórmula de Kirpich adaptada:

\[
T_c = 57 \left(\frac{L^3}{H}\right)^{0,385}
\]

Onde:

- \(T_c\) = tempo de concentração, minutos.
- \(L\) = comprimento do talvegue, km.
- \(H\) = desnível, m.

### Memorial

1. Informar \(L\).
2. Informar \(H\).
3. Calcular \(L^3/H\).
4. Elevar a 0,385.
5. Multiplicar por 57.
6. Resultado: \(T_c\).

## 4.4 Chuva de projeto

Utilizar equação IDF regional:

\[
I = \frac{K \cdot TR^a}{(t+b)^c}
\]

Onde:

- \(I\) = intensidade da chuva, mm/h.
- \(TR\) = tempo de retorno, anos.
- \(t\) = duração da chuva, minutos.
- \(K, a, b, c\) = parâmetros regionais da equação IDF.

### Critério

Para método racional, adotar:

\[
t = T_c
\]

## 4.5 Vazão de pico pelo método racional

\[
Q_p = 0,278 \cdot C \cdot I \cdot A
\]

Onde:

- \(Q_p\) = vazão de pico, m³/s.
- \(C\) = coeficiente de escoamento.
- \(I\) = intensidade de chuva, mm/h.
- \(A\) = área da bacia, km².

### Coeficientes de escoamento preliminares

| Uso do solo | C típico |
|---|---:|
| Mata preservada | 0,10 a 0,30 |
| Pastagem | 0,20 a 0,45 |
| Agricultura | 0,30 a 0,60 |
| Solo exposto | 0,50 a 0,80 |
| Urbano pouco denso | 0,40 a 0,70 |
| Urbano denso | 0,70 a 0,95 |

## 4.6 Vazões mínimas

### Q95

Vazão igualada ou superada em 95% do tempo.

### Q90

Vazão igualada ou superada em 90% do tempo.

### Q7,10

Menor média móvel de 7 dias consecutivos associada a tempo de retorno de 10 anos.

## 4.7 Regionalização hidrológica

Quando não houver posto fluviométrico na seção de interesse, o sistema deve permitir:

- Escolha de estação fluviométrica representativa.
- Transposição de vazões por área.
- Regionalização por equações oficiais.
- Ajuste por precipitação média.
- Ajuste por características fisiográficas.

### Transposição simples por área

\[
Q_{local} = Q_{posto} \cdot \left(\frac{A_{local}}{A_{posto}}\right)^b
\]

Onde:

- \(b\) = expoente regional, muitas vezes entre 0,7 e 1,0, devendo ser justificado.

---

# 5. BALANÇO HÍDRICO E REGULARIZAÇÃO DE VAZÃO

## 5.1 Equação geral do reservatório

\[
S_{t+1} = S_t + V_{afl} + V_{chuva} - V_{dem} - V_{evap} - V_{inf} - V_{vert}
\]

Onde:

- \(S_t\) = armazenamento inicial.
- \(S_{t+1}\) = armazenamento final.
- \(V_{afl}\) = volume afluente.
- \(V_{chuva}\) = volume de chuva direta no reservatório.
- \(V_{dem}\) = volume demandado.
- \(V_{evap}\) = perda por evaporação.
- \(V_{inf}\) = perda por infiltração/percolação.
- \(V_{vert}\) = volume vertido.

## 5.2 Volume afluente

\[
V_{afl} = Q_m \cdot \Delta t
\]

Para mês com \(d\) dias:

\[
V_{afl,mês} = Q_m \cdot d \cdot 24 \cdot 3600
\]

## 5.3 Volume demandado

\[
V_{dem} = Q_{dem} \cdot d \cdot 24 \cdot 3600
\]

## 5.4 Evaporação

\[
V_{evap} = E \cdot A_{espelho}
\]

Onde:

- \(E\) = evaporação líquida no período, m.
- \(A_{espelho}\) = área média do espelho d'água, m².

## 5.5 Método de Rippl

### Procedimento

1. Montar série mensal ou diária de vazões.
2. Converter vazões em volumes.
3. Definir demanda constante ou variável.
4. Calcular saldo mensal:

\[
Saldo_i = V_{afl,i} - V_{dem,i}
\]

5. Calcular déficit:

\[
D_i = V_{dem,i} - V_{afl,i}
\]

6. Acumular déficits em períodos secos.
7. O maior déficit acumulado é o volume útil necessário.

### Tabela padrão

| Mês | Q afluente (m³/s) | V afluente (m³) | Q demanda (m³/s) | V demanda (m³) | Evaporação (m³) | Saldo (m³) | Déficit acumulado (m³) |
|---|---:|---:|---:|---:|---:|---:|---:|

## 5.6 Volume útil, volume morto e volume total

\[
V_{total} = V_{morto} + V_{útil} + V_{espera}
\]

Onde:

- \(V_{morto}\) = volume abaixo da tomada útil.
- \(V_{útil}\) = volume efetivamente operável.
- \(V_{espera}\) = volume reservado para amortecimento de cheias, quando aplicável.

---

# 6. DIMENSIONAMENTO DO MACIÇO DE TERRA

## 6.1 Altura da barragem

\[
H_b = C_{crista} - C_{fundação}
\]

## 6.2 Borda livre

\[
BL = C_{crista} - C_{NAmax}
\]

A borda livre deve considerar:

- Sobrelevação por vento.
- Onda.
- Recalque.
- Incertezas topográficas.
- Segurança operacional.

## 6.3 Largura da crista

Critério preliminar:

\[
B_c = 3 + \frac{H_b}{5}
\]

Onde:

- \(B_c\) = largura da crista, m.
- \(H_b\) = altura da barragem, m.

## 6.4 Taludes

Valores preliminares:

| Face | Inclinação preliminar |
|---|---:|
| Montante | 3H:1V |
| Jusante | 2,5H:1V a 3H:1V |

## 6.5 Base do maciço

\[
B_b = B_c + m_1 H_b + m_2 H_b
\]

Onde:

- \(m_1\) = inclinação horizontal do talude de montante.
- \(m_2\) = inclinação horizontal do talude de jusante.

## 6.6 Área da seção transversal

\[
A_s = \frac{B_c + B_b}{2} \cdot H_b
\]

## 6.7 Volume do maciço

\[
V_m = A_s \cdot L_e
\]

Onde:

- \(L_e\) = comprimento da barragem no eixo.

## 6.8 Quantitativos

Separar:

- Volume de solo compactado.
- Volume de núcleo impermeável.
- Volume de filtros.
- Volume de drenos.
- Volume de enrocamento.
- Volume de proteção vegetal.
- Volume de escavação.
- Volume de limpeza e remoção de solo orgânico.

---

# 7. FILTROS, DRENOS E PERCOLAÇÃO

## 7.1 Lei de Darcy

\[
Q = k \cdot i \cdot A
\]

Onde:

- \(Q\) = vazão percolada.
- \(k\) = coeficiente de permeabilidade.
- \(i\) = gradiente hidráulico.
- \(A\) = área de fluxo.

## 7.2 Gradiente hidráulico

\[
i = \frac{\Delta h}{L}
\]

## 7.3 Critério de filtro

### Retenção

\[
D_{15filtro} \leq 4 \cdot D_{85solo}
\]

### Permeabilidade

\[
D_{15filtro} \geq 4 \cdot D_{15solo}
\]

## 7.4 Componentes de drenagem

- Filtro vertical/chaminé.
- Tapete drenante horizontal.
- Dreno de pé.
- Trincheira de vedação.
- Cut-off.
- Poços de alívio, quando aplicáveis.

## 7.5 Verificações

- Linha freática não deve emergir no talude de jusante.
- Gradiente de saída deve ser inferior ao gradiente crítico com fator de segurança adequado.
- Não deve haver carreamento de finos.
- Vazões de drenagem devem ser mensuráveis e monitoráveis.

---

# 8. ESTABILIDADE DE TALUDES E FUNDAÇÕES

## 8.1 Cenários mínimos

| Cenário | Descrição |
|---|---|
| Final de construção | Maciço compactado sem reservatório cheio |
| Operação normal | Reservatório no NA normal |
| Cheia | Reservatório no NA máximo |
| Rebaixamento rápido | Queda rápida do nível d'água |
| Sismo | Quando exigido |
| Percolação elevada | Linha freática desfavorável |

## 8.2 Fator de segurança

\[
FS = \frac{Resistências}{Solicitações}
\]

## 8.3 Resistência ao cisalhamento

\[
\tau = c' + \sigma' \tan \phi'
\]

Onde:

- \(c'\) = coesão efetiva.
- \(\sigma'\) = tensão normal efetiva.
- \(\phi'\) = ângulo de atrito efetivo.

## 8.4 Métodos

### Fellenius

Método das fatias ordinário, adequado para análises preliminares.

### Bishop simplificado

Adequado para superfícies circulares e análises de estabilidade de taludes de terra.

### Janbu

Pode ser aplicado a superfícies não circulares.

### Morgenstern-Price

Método rigoroso, recomendado para análises avançadas.

## 8.5 Critérios preliminares

| Situação | FS mínimo preliminar |
|---|---:|
| Operação normal | 1,50 |
| Final de construção | 1,30 a 1,50 |
| Rebaixamento rápido | 1,20 a 1,30 |
| Sismo | 1,10 a 1,20 |

> Os valores devem ser ajustados por norma, órgão fiscalizador, porte da barragem, consequência de ruptura e julgamento do engenheiro responsável.

---

# 9. BARRAGENS DE CONCRETO GRAVIDADE

## 9.1 Ações

- Peso próprio.
- Empuxo hidrostático.
- Subpressão.
- Empuxo de sedimentos.
- Sismo, se aplicável.
- Pressão de gelo, onde aplicável.
- Variação térmica.
- Cargas de equipamentos.

## 9.2 Empuxo hidrostático

Pressão:

\[
p = \gamma_w h
\]

Força horizontal por metro:

\[
F_h = \frac{\gamma_w h^2}{2}
\]

Ponto de aplicação:

\[
y = \frac{h}{3}
\]

## 9.3 Peso próprio

\[
W = \gamma_c \cdot A
\]

Onde:

- \(\gamma_c\) = peso específico do concreto.
- \(A\) = área da seção por metro.

## 9.4 Deslizamento

\[
FS_d = \frac{W' \tan \phi + cA_b}{F_h}
\]

Onde:

- \(W' = W - U\)
- \(U\) = subpressão.
- \(A_b\) = área da base.

## 9.5 Tombamento

\[
FS_t = \frac{\sum M_R}{\sum M_T}
\]

## 9.6 Tensões na base

\[
\sigma = \frac{W'}{A_b} \pm \frac{M}{S}
\]

---

# 10. VERTEDOUROS E EXTRAVASORES

## 10.1 Objetivo

Conduzir a cheia de projeto sem galgamento da barragem e sem erosão perigosa.

## 10.2 Tipos

- Canal lateral.
- Soleira livre.
- Soleira Creager/WES.
- Tulipa.
- Vertedouro em degraus.
- Labirinto.
- Galgável, quando o material e o projeto permitirem.

## 10.3 Vazão em soleira livre

\[
Q = C_d \cdot L \cdot H^{3/2}
\]

Onde:

- \(Q\) = vazão, m³/s.
- \(C_d\) = coeficiente.
- \(L\) = largura efetiva, m.
- \(H\) = carga hidráulica, m.

## 10.4 Largura necessária

\[
L = \frac{Q}{C_d \cdot H^{3/2}}
\]

## 10.5 Canal de descarga — Manning

\[
Q = \frac{1}{n} A R^{2/3} S^{1/2}
\]

Onde:

- \(n\) = coeficiente de Manning.
- \(A\) = área molhada.
- \(R\) = raio hidráulico.
- \(S\) = declividade.

## 10.6 Velocidade

\[
V = \frac{Q}{A}
\]

## 10.7 Verificações obrigatórias

- Capacidade hidráulica.
- Velocidade admissível.
- Erosão do canal.
- Dissipação a jusante.
- Remanso.
- Afogamento.
- Borda livre.
- Condição de cheia excepcional.
- Segurança contra obstrução.

---

# 11. TOMADA D'ÁGUA, DESCARGA DE FUNDO E CONTROLE OPERACIONAL

## 11.1 Vazão em orifício

\[
Q = C_d A \sqrt{2gh}
\]

## 11.2 Área necessária

\[
A = \frac{Q}{C_d \sqrt{2gh}}
\]

## 11.3 Diâmetro equivalente

\[
D = \sqrt{\frac{4A}{\pi}}
\]

## 11.4 Componentes

- Gradeamento.
- Torre ou caixa de tomada.
- Tubulação.
- Registro.
- Válvula.
- Caixa de manobra.
- Descarga de fundo.
- Dissipador na saída.
- Medidor de vazão, quando aplicável.

## 11.5 Regras de projeto

- Evitar tubulação desprotegida atravessando maciço sem colar anti-percolação ou solução de engenharia adequada.
- Permitir operação segura por jusante.
- Garantir dissipação na saída.
- Prever manutenção.
- Prever fechamento emergencial.

---

# 12. BARRAMENTOS SEM REGULARIZAÇÃO E DIQUES NO CURSO D'ÁGUA

## 12.1 Estudos específicos

- Verificar se a estrutura é galgável ou não galgável.
- Calcular nível de montante.
- Calcular nível de jusante.
- Verificar remanso.
- Verificar erosão no pé de jusante.
- Verificar estabilidade.
- Verificar interferência em terceiros.
- Verificar passagem de sedimentos.
- Verificar fauna aquática, se aplicável.

## 12.2 Vazão sobre soleira

\[
Q = C_d L H^{3/2}
\]

## 12.3 Número de Froude

\[
Fr = \frac{V}{\sqrt{gy}}
\]

Se \(Fr > 1\), o escoamento é supercrítico e pode exigir dissipação.

## 12.4 Energia específica

\[
E = y + \frac{V^2}{2g}
\]

## 12.5 Comprimento preliminar de proteção

\[
L_p = 4h \text{ a } 6h
\]

Onde:

- \(h\) = altura da queda.

---

# 13. ESTUDO DE RUPTURA HIPOTÉTICA — DAM BREAK

## 13.1 Objetivo

O estudo de ruptura hipotética tem como objetivo simular cenários de falha da barragem, estimar onda de cheia, mapear áreas inundáveis, calcular tempos de chegada, profundidades, velocidades e subsidiar o PAE, a classificação de dano potencial e a gestão de risco.

## 13.2 Cenários mínimos

### Cenário 1 — Ruptura em dia seco

Também chamado de sunny day failure. Considera falha sem cheia extrema.

### Cenário 2 — Ruptura com cheia

Considera falha durante evento hidrológico extremo.

### Cenário 3 — Galgamento

Ruptura provocada por vertedouro insuficiente, obstrução ou cheia superior à de projeto.

### Cenário 4 — Piping

Ruptura progressiva por erosão interna.

### Cenário 5 — Ruptura parcial

Falha localizada ou abertura incompleta.

## 13.3 Dados de entrada

| Dado | Unidade | Uso |
|---|---:|---|
| Volume do reservatório | m³ | Hidrograma de ruptura |
| Altura da barragem | m | Energia potencial |
| Cota da crista | m | Geometria |
| Cota do fundo | m | Profundidade |
| Curva cota-volume | - | Reservatório |
| Geometria do vale jusante | - | Propagação |
| MDT | raster | Mapeamento |
| Rugosidade Manning | - | Modelo hidráulico |
| Hidrograma afluente | m³/s | Cenário com cheia |
| População jusante | pessoas | DPA/PAE |
| Infraestrutura jusante | - | Consequências |

## 13.4 Parâmetros de brecha

### Largura final da brecha

\[
B_b
\]

### Tempo de formação

\[
t_f
\]

### Inclinação lateral

\[
z_b
\]

### Cota final da brecha

\[
C_{brecha}
\]

## 13.5 Forma simplificada do hidrograma de ruptura

Para triagem preliminar, pode-se usar aproximação triangular:

\[
V = \frac{Q_p \cdot T_b}{2}
\]

Logo:

\[
Q_p = \frac{2V}{T_b}
\]

Onde:

- \(V\) = volume mobilizado.
- \(Q_p\) = vazão de pico aproximada.
- \(T_b\) = duração base do hidrograma.

> Essa aproximação é apenas triagem. Estudos formais devem usar modelo hidrodinâmico adequado, como HEC-RAS 1D/2D ou equivalente.

## 13.6 Modelagem hidrodinâmica

### Etapas HEC-RAS/QGIS

1. Preparar MDT.
2. Corrigir hidrografia.
3. Criar geometria do vale.
4. Definir área 2D.
5. Definir malha computacional.
6. Inserir barragem como estrutura.
7. Definir brecha.
8. Inserir hidrograma de entrada.
9. Definir condições de contorno.
10. Rodar simulação não permanente.
11. Gerar mapas de:
    - profundidade máxima;
    - velocidade máxima;
    - tempo de chegada;
    - cota máxima;
    - produto profundidade × velocidade;
    - zonas de risco.
12. Exportar mapas para PDF, GeoPackage, SHP e imagens.

## 13.7 Produtos finais do Dam Break

- Relatório metodológico.
- Hidrogramas de ruptura.
- Mapas de inundação.
- Mapas de profundidade.
- Mapas de velocidade.
- Mapas de tempo de chegada.
- Identificação da Zona de Autossalvamento (ZAS).
- Cadastro de edificações atingidas.
- Rotas de fuga.
- Pontos de encontro.
- Insumos para PAE.

---

# 14. PLANO DE SEGURANÇA DA BARRAGEM — PSB

## 14.1 Conteúdo mínimo recomendado

1. Identificação do empreendedor.
2. Identificação da barragem.
3. Características técnicas.
4. Projeto como construído.
5. Manual de operação.
6. Plano de manutenção.
7. Plano de inspeção.
8. Instrumentação.
9. Classificação de risco.
10. Dano potencial associado.
11. Revisões periódicas.
12. Registros históricos.
13. Anomalias.
14. Medidas corretivas.
15. PAE, quando aplicável.

## 14.2 Inspeção de segurança regular

Itens:

- Crista.
- Talude de montante.
- Talude de jusante.
- Vertedouro.
- Canal de descarga.
- Tomada d'água.
- Drenos.
- Piezômetros.
- Marcos superficiais.
- Surgências.
- Trincas.
- Recalques.
- Erosões.
- Vegetação.
- Animais escavadores.

## 14.3 Classificação de anomalias

| Nível | Condição | Ação |
|---|---|---|
| Normal | Sem anomalia crítica | Monitorar |
| Atenção | Anomalia inicial | Intensificar inspeção |
| Alerta | Anomalia evolutiva | Acionar responsável técnico |
| Emergência | Risco iminente | Acionar PAE |

---

# 15. PLANO DE AÇÃO DE EMERGÊNCIA — PAE

## 15.1 Objetivo

Definir responsabilidades, procedimentos de notificação, níveis de emergência, recursos disponíveis, zonas atingidas, rotas de fuga e ações para reduzir danos em eventual falha ou condição insegura.

## 15.2 Níveis de resposta

### Nível Verde

Operação normal.

### Nível Amarelo

Anomalia detectada, sem risco imediato.

### Nível Laranja

Situação potencialmente perigosa com possibilidade de evolução.

### Nível Vermelho

Ruptura iminente ou em andamento.

## 15.3 Fluxograma de notificação

O sistema deve gerar automaticamente:

- Empreendedor.
- Responsável técnico.
- Defesa Civil municipal.
- Órgão fiscalizador.
- Corpo de Bombeiros.
- Polícia Militar.
- Prefeitura.
- Comunidades atingidas.
- Operadores da barragem.
- Equipe de campo.

## 15.4 Produtos

- Documento PAE.
- Mapa de inundação.
- Lista de contatos.
- Rotas de fuga.
- Pontos de encontro.
- Fichas de resposta.
- Plano de comunicação.
- Registro de treinamentos.

---

# 16. OUTORGA, LICENCIAMENTO E DOCUMENTAÇÃO

## 16.1 Documentos técnicos

- Requerimento.
- Formulário do órgão gestor.
- ART.
- Memorial descritivo.
- Memorial de cálculo.
- Estudo hidrológico.
- Estudo hidráulico.
- Estudo geotécnico.
- Planta de localização.
- Planta do reservatório.
- Planta do eixo.
- Seções transversais.
- Curva cota-área-volume.
- Relatório fotográfico.
- Comprovação de propriedade/posse.
- Cadastro ambiental rural, quando aplicável.
- Anuências de terceiros, quando necessárias.

## 16.2 Estruturas de relatório para IGAM/MG

O sistema deve possuir modelos específicos para:

- Barramento sem regularização.
- Barramento com regularização menor que 5 ha.
- Barramento com regularização maior que 5 ha.
- Barramento sem captação.
- Barramento sem captação para regularização.
- Captação em barramento sem regularização.
- Captação em curso d'água.
- Desvio.
- Canalização.
- Travessia.

---

# 17. MEMORIAL DE CÁLCULO — MODELO PADRÃO

Todo cálculo automático deve seguir o formato:

## 17.1 Identificação

- Nome do cálculo.
- Módulo.
- Estrutura.
- Responsável técnico.
- Data.
- Versão.

## 17.2 Dados de entrada

| Variável | Símbolo | Valor | Unidade | Fonte |
|---|---:|---:|---|---|

## 17.3 Fórmula

Apresentar fórmula em LaTeX.

## 17.4 Substituição

Apresentar valores substituídos.

## 17.5 Resultado

Apresentar resultado com unidade.

## 17.6 Critério de aceitação

Informar se atende ou não atende.

## 17.7 Conclusão

Texto automático com recomendação.

---

# 18. EXEMPLO DE MEMORIAL — VAZÃO DE PICO

## Dados

| Variável | Valor |
|---|---:|
| Área da bacia | 5,00 km² |
| Coeficiente C | 0,40 |
| Intensidade I | 120 mm/h |

## Fórmula

\[
Q = 0,278 \cdot C \cdot I \cdot A
\]

## Substituição

\[
Q = 0,278 \cdot 0,40 \cdot 120 \cdot 5
\]

## Resultado

\[
Q = 66,72 \, m³/s
\]

## Conclusão

A vazão de pico estimada pelo método racional é de 66,72 m³/s. Este valor deve ser usado preliminarmente no dimensionamento hidráulico do vertedouro, respeitados os limites de aplicação do método racional.

---

# 19. EXEMPLO DE MEMORIAL — VERTEDOURO

## Dados

| Variável | Valor |
|---|---:|
| Vazão de projeto | 66,72 m³/s |
| Coeficiente \(C_d\) | 1,80 |
| Carga \(H\) | 1,20 m |

## Fórmula

\[
L = \frac{Q}{C_d \cdot H^{3/2}}
\]

## Substituição

\[
L = \frac{66,72}{1,80 \cdot 1,20^{3/2}}
\]

## Cálculo

\[
1,20^{3/2} = 1,314
\]

\[
L = \frac{66,72}{2,365}
\]

\[
L = 28,21 \, m
\]

## Conclusão

A largura preliminar do vertedouro é de 28,21 m. Deve-se verificar canal de aproximação, canal de descarga, dissipação de energia, erosão e borda livre.

---

# PARTE B — ERS: DOCUMENTO DE REQUISITOS DE SOFTWARE

---

# 20. VISÃO GERAL DO SISTEMA

## 20.1 Nome sugerido

**Sistema Integrado de Engenharia de Barragens e Barramentos — SIEBB**

## 20.2 Objetivo

Desenvolver uma plataforma capaz de:

- Cadastrar empreendimentos.
- Receber dados de campo.
- Processar topografia.
- Calcular hidrologia.
- Calcular regularização de vazão.
- Dimensionar barragens.
- Dimensionar barramentos.
- Dimensionar vertedouros.
- Verificar estabilidade.
- Gerar memoriais.
- Gerar relatórios.
- Gerar documentos de outorga.
- Gerar PSB.
- Gerar PAE.
- Gerar plano e estudo de Dam Break.
- Exportar resultados para PDF, Markdown, DOCX, XLSX, DXF, SHP, GeoPackage e JSON.

## 20.3 Usuários

| Usuário | Permissões |
|---|---|
| Administrador | Tudo |
| Engenheiro responsável | Cadastrar, calcular, revisar, assinar |
| Técnico de campo | Inserir dados e fotos |
| Projetista | Plantas e desenhos |
| Cliente | Visualizar relatórios |
| Auditor | Visualizar histórico e versões |

---

# 21. REQUISITOS FUNCIONAIS

## RF-001 — Cadastro do empreendimento

O sistema deve permitir cadastrar:

- Nome do projeto.
- Proprietário.
- CPF/CNPJ.
- Imóvel.
- Matrícula.
- CAR.
- Município.
- Estado.
- Coordenadas.
- Curso d'água.
- Bacia.
- Finalidade.
- Responsável técnico.
- ART.

## RF-002 — Entrada de dados de campo

O sistema deve permitir entrada por:

- Formulário web.
- Aplicativo mobile.
- CSV.
- XLSX.
- GeoJSON.
- SHP.
- KML.
- DXF.
- Fotos georreferenciadas.
- Pontos GNSS.
- MDT/raster.

## RF-003 — Validação automática

O sistema deve validar:

- Unidades.
- Campos obrigatórios.
- Coordenadas.
- Vazões negativas.
- Cotas incoerentes.
- Volume incompatível.
- Área inundada decrescente.
- Cota da crista inferior ao NA máximo.
- Vertedouro insuficiente.
- FS menor que critério mínimo.

## RF-004 — Módulo topográfico

O sistema deve:

- Importar MDT.
- Gerar curvas de nível.
- Delimitar área inundada por cota.
- Calcular volume por cota.
- Gerar curva cota-área-volume.
- Gerar gráficos.
- Exportar mapas.

## RF-005 — Módulo hidrológico

O sistema deve calcular:

- Área da bacia.
- Comprimento do talvegue.
- Declividade.
- Tempo de concentração.
- Chuva IDF.
- Vazão pelo método racional.
- Vazões mínimas.
- Vazões médias.
- Vazões máximas.
- Regionalização.
- Hidrograma SCS.

## RF-006 — Módulo de regularização

O sistema deve:

- Receber série mensal/diária.
- Converter vazão em volume.
- Receber demandas.
- Calcular perdas.
- Aplicar método de Rippl.
- Calcular volume útil.
- Simular operação do reservatório.
- Gerar curva de garantia.

## RF-007 — Módulo de maciço

O sistema deve dimensionar:

- Altura.
- Crista.
- Taludes.
- Base.
- Área da seção.
- Volume.
- Núcleo.
- Filtros.
- Drenos.
- Proteções.

## RF-008 — Módulo hidráulico

O sistema deve dimensionar:

- Vertedouro.
- Canal de descarga.
- Tomada d'água.
- Descarga de fundo.
- Dissipador.
- Barramento galgável.
- Soleira.

## RF-009 — Módulo geotécnico

O sistema deve registrar:

- Sondagens.
- Ensaios.
- Camadas de solo.
- Parâmetros.
- Materiais de empréstimo.
- Compactação.

E calcular:

- Percolação.
- Gradiente.
- Filtro.
- FS de taludes.
- Capacidade de carga.

## RF-010 — Módulo de segurança

O sistema deve gerar:

- Classificação preliminar.
- Inspeção regular.
- Fichas de anomalia.
- PSB.
- PAE.
- Plano de monitoramento.
- Plano de manutenção.

## RF-011 — Módulo Dam Break

O sistema deve:

- Receber dados do reservatório.
- Receber MDT jusante.
- Receber curva cota-volume.
- Definir cenários.
- Estimar brecha.
- Gerar hidrograma preliminar.
- Exportar insumos para HEC-RAS.
- Importar resultados de HEC-RAS.
- Gerar mapas de inundação.
- Gerar tabelas de tempo de chegada.
- Gerar relatório.

## RF-012 — Geração documental

O sistema deve gerar:

- Memorial descritivo.
- Memorial de cálculo.
- Relatório técnico.
- Estudo hidrológico.
- Estudo hidráulico.
- Estudo geotécnico.
- Relatório de Dam Break.
- PSB.
- PAE.
- Checklists.
- Anexos.
- Tabelas para outorga.

---

# 22. REQUISITOS NÃO FUNCIONAIS

## RNF-001 — Rastreabilidade

Todo resultado deve armazenar:

- Dados de entrada.
- Fórmula.
- Versão do algoritmo.
- Data/hora.
- Usuário.
- Fonte dos dados.
- Unidade.
- Resultado.
- Critério.

## RNF-002 — Auditabilidade

O sistema deve manter histórico de alterações.

## RNF-003 — Segurança

- Controle de acesso.
- Backup.
- Criptografia.
- LGPD.
- Logs.

## RNF-004 — Precisão

O sistema deve permitir configurar número de casas decimais e tolerâncias.

## RNF-005 — Exportação

Exportar para:

- PDF.
- DOCX.
- Markdown.
- XLSX.
- CSV.
- JSON.
- GeoJSON.
- SHP.
- DXF.
- GeoPackage.

## RNF-006 — Modularidade

Cada módulo deve ser independente e reutilizável.

---

# 23. MODELO DE BANCO DE DADOS

## 23.1 Tabelas principais

### projects

| Campo | Tipo |
|---|---|
| id | uuid |
| name | text |
| owner_id | uuid |
| municipality | text |
| state | text |
| watershed | text |
| watercourse | text |
| purpose | text |
| created_at | timestamp |

### field_surveys

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| survey_date | date |
| team | text |
| notes | text |

### topography_points

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| x | numeric |
| y | numeric |
| z | numeric |
| source | text |

### elevation_area_volume

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| elevation | numeric |
| area_m2 | numeric |
| partial_volume_m3 | numeric |
| accumulated_volume_m3 | numeric |

### hydrology_results

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| method | text |
| return_period | numeric |
| rainfall_intensity | numeric |
| peak_flow | numeric |
| created_at | timestamp |

### dam_geometry

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| dam_type | text |
| crest_elevation | numeric |
| foundation_elevation | numeric |
| height | numeric |
| crest_width | numeric |
| upstream_slope | numeric |
| downstream_slope | numeric |

### spillway_design

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| type | text |
| design_flow | numeric |
| coefficient | numeric |
| head | numeric |
| width | numeric |

### dam_break_scenarios

| Campo | Tipo |
|---|---|
| id | uuid |
| project_id | uuid |
| scenario_type | text |
| breach_width | numeric |
| breach_time | numeric |
| peak_outflow | numeric |
| model_file | text |

---

# 24. ARQUITETURA SUGERIDA

## 24.1 Backend

- Python.
- FastAPI.
- PostgreSQL.
- PostGIS.
- Celery/RQ para processamento pesado.
- Pandas/NumPy/SciPy.
- Rasterio/GDAL.
- GeoPandas.
- PyProj.
- Shapely.

## 24.2 Frontend

- React ou Next.js.
- MapLibre/Leaflet.
- Formulários dinâmicos.
- Visualização gráfica.
- Editor de relatórios.

## 24.3 GIS

- QGIS.
- PostGIS.
- GeoPackage.
- Raster DEM.
- Exportação SHP/GeoJSON.

## 24.4 Hidráulica

- Integração com HEC-RAS.
- Exportação de geometrias.
- Importação de resultados.
- Mapas de inundação.

## 24.5 Relatórios

- Markdown como formato base.
- Conversão para DOCX/PDF.
- Templates Jinja2.
- Planilhas XLSX.

---

# 25. REGRAS DE VALIDAÇÃO AUTOMÁTICA

## 25.1 Topografia

- Áreas devem crescer com a cota.
- Volumes devem crescer com a cota.
- Cota da crista deve ser maior que NA máximo.
- Cota do vertedouro deve ser menor que crista.
- Cota da tomada deve ser compatível com volume morto.

## 25.2 Hidrologia

- Área da bacia > 0.
- Intensidade de chuva > 0.
- TR válido.
- Tempo de concentração > 0.
- Coeficiente C entre 0 e 1.

## 25.3 Hidráulica

- Vazão de projeto > 0.
- Largura do vertedouro > 0.
- Carga H > 0.
- Velocidade menor que admissível ou exigir proteção.

## 25.4 Geotecnia

- \(c \geq 0\).
- \(0 < \phi < 45°\) usualmente.
- \(k > 0\).
- FS deve atender critério.

## 25.5 Segurança

- Se DPA alto, exigir PAE.
- Se anomalia crítica, bloquear aprovação automática.
- Se dados de Dam Break ausentes e PAE exigido, marcar pendência.

---

# 26. MOTOR DE CÁLCULO — DESIGN

## 26.1 Estrutura de cada função

Cada função de cálculo deve retornar:

```json
{
  "input": {},
  "formula": "",
  "steps": [],
  "result": {},
  "criteria": {},
  "status": "atende | nao_atende | revisar",
  "warnings": []
}
```

## 26.2 Exemplo de função: vazão racional

```python
def rational_method(C, I, A):
    Q = 0.278 * C * I * A
    return {
        "formula": "Q = 0.278*C*I*A",
        "result": {"Q_m3s": Q},
        "status": "calculado"
    }
```

## 26.3 Exemplo de função: vertedouro

```python
def spillway_width(Q, Cd, H):
    L = Q / (Cd * H**1.5)
    return {
        "formula": "L = Q/(Cd*H^(3/2))",
        "result": {"L_m": L},
        "status": "calculado"
    }
```

---

# 27. GERAÇÃO AUTOMÁTICA DE DOCUMENTOS

## 27.1 Templates

Cada documento deve possuir template em Markdown:

- `memorial_descritivo.md`
- `memorial_calculo.md`
- `relatorio_hidrologico.md`
- `relatorio_hidraulico.md`
- `relatorio_geotecnico.md`
- `psb.md`
- `pae.md`
- `dam_break.md`
- `outorga_igam.md`

## 27.2 Pipeline

1. Validar dados.
2. Executar cálculos.
3. Armazenar resultados.
4. Preencher templates.
5. Inserir gráficos.
6. Inserir mapas.
7. Gerar Markdown.
8. Converter para PDF/DOCX.
9. Salvar versão.
10. Registrar hash.

---

# 28. PLANO DE DESENVOLVIMENTO DO PROJETO

## Fase 1 — MVP

- Cadastro de projeto.
- Entrada de dados básicos.
- Curva cota-área-volume manual.
- Cálculo de vazão racional.
- Cálculo de vertedouro.
- Memorial de cálculo em Markdown.
- Exportação PDF.

## Fase 2 — Hidrologia e regularização

- Séries mensais.
- Método de Rippl.
- Demandas.
- Evaporação.
- Simulação de reservatório.

## Fase 3 — Geotecnia

- Cadastro de sondagens.
- Camadas.
- Parâmetros.
- Filtros.
- Percolação.
- Estabilidade simplificada.

## Fase 4 — GIS

- Importação de MDT.
- Cota-área-volume automática.
- Mapas.
- Exportação GeoPackage.

## Fase 5 — Segurança

- Inspeções.
- PSB.
- PAE.
- Classificação.
- Anomalias.

## Fase 6 — Dam Break

- Cenários.
- Brecha.
- Hidrograma preliminar.
- Integração HEC-RAS.
- Mapas de inundação.
- Rotas de fuga.

## Fase 7 — Outorga

- Templates IGAM/ANA.
- Documentos automáticos.
- Checklists.
- Protocolos.

---

# 29. BACKLOG TÉCNICO

## Hidrologia

- [ ] IDF por município.
- [ ] Método racional.
- [ ] SCS-CN.
- [ ] Hidrograma unitário.
- [ ] Regionalização.
- [ ] Q7,10.
- [ ] Q95.
- [ ] Q90.

## Hidráulica

- [ ] Vertedouro retangular.
- [ ] Vertedouro WES.
- [ ] Canal trapezoidal.
- [ ] Manning.
- [ ] Dissipador.
- [ ] Soleira galgável.

## Geotecnia

- [ ] Cadastro SPT.
- [ ] Camadas.
- [ ] Compactação.
- [ ] Filtros.
- [ ] Percolação.
- [ ] Bishop simplificado.

## Dam Break

- [ ] Brecha.
- [ ] Hidrograma.
- [ ] HEC-RAS export.
- [ ] HEC-RAS import.
- [ ] Mapa inundação.
- [ ] PAE.

---

# 30. CHECKLIST FINAL DO PROJETO TÉCNICO

## Documentos

- [ ] Memorial descritivo.
- [ ] Memorial de cálculo.
- [ ] Estudo hidrológico.
- [ ] Estudo hidráulico.
- [ ] Estudo geotécnico.
- [ ] Projeto do maciço.
- [ ] Projeto do vertedouro.
- [ ] Projeto da tomada.
- [ ] Projeto de drenagem.
- [ ] Relatório de estabilidade.
- [ ] Relatório Dam Break, quando aplicável.
- [ ] PSB, quando aplicável.
- [ ] PAE, quando aplicável.
- [ ] Outorga.
- [ ] Licenciamento.
- [ ] ART.

## Plantas

- [ ] Localização.
- [ ] Bacia.
- [ ] Reservatório.
- [ ] Eixo.
- [ ] Perfil longitudinal.
- [ ] Seções.
- [ ] Vertedouro.
- [ ] Tomada.
- [ ] Dissipador.
- [ ] Mapa de inundação.

---

# 31. CONCLUSÃO

Este documento constitui uma base técnica e funcional para desenvolver uma plataforma automatizada de engenharia de barragens e barramentos. Ele organiza os principais estudos, cálculos, verificações, documentos, estruturas de dados, módulos computacionais e fluxos de trabalho necessários para transformar dados de campo em produtos técnicos completos.

A implementação deve sempre manter a premissa de que o sistema apoia o engenheiro responsável, mas não substitui responsabilidade técnica, validação profissional, análise crítica, inspeção de campo, atendimento normativo e aprovação pelos órgãos competentes.

---

# 32. REFERÊNCIAS E FONTES CONSULTADAS

- ANA — Diretrizes para a Elaboração de Projeto de Barragens.
- ANA — Manual do Empreendedor sobre Segurança de Barragens.
- ANA — Resolução nº 236/2017.
- Lei Federal nº 12.334/2010 — Política Nacional de Segurança de Barragens.
- Lei Federal nº 14.066/2020 — alterações da PNSB.
- CNRH — Resolução nº 143/2012.
- IGAM/MG — Formulários e Termos de Referência para Processos de Outorga.
- USACE HEC-RAS — Dam/Levee Breach Analysis.
- FEMA P-946 — Federal Guidelines for Inundation Mapping of Flood Risks Associated with Dam Incidents and Failures.

