# Prompts para Cursor — Fiscal Ambiental Digital

## Prompt 1 — Ler todo o plano

```text
Leia todos os documentos em docs/fiscal-ambiental-digital.
O objetivo é implementar o submenu IA > Fiscal Ambiental Digital no AmbientaR.
A lógica principal é montar um acervo satelital gratuito do INPE/CBERS por imóvel/projeto, e depois criar camadas de comparação, inteligência, fiscalização, relatórios, monitoramento e ESG.
Antes de codar, gere um checklist de arquivos que serão criados/alterados.
```

---

## Prompt 2 — Fase 0

```text
Implemente somente a Fase 0.
Crie rotas, navegação, shell, componentes placeholder, tipos base, constants, permissions, firestore paths e storage paths.
Não implemente processamento INPE ainda.
Rode lint/typecheck/build e corrija erros.
```

---

## Prompt 3 — Fase 1

```text
Implemente a Fase 1.
Crie o wizard Montar Acervo INPE e a Biblioteca Satelital.
Crie APIs /api/fiscal-ambiental/archive, /archive/build, /archive/status, /inpe/availability.
Crie modelos Firestore e Storage.
Integre com worker placeholder se o worker real ainda não existir.
```

---

## Prompt 4 — Worker satelital

```text
Crie infra/fiscal-satellite-worker com FastAPI ou Flask, GDAL e endpoints health, availability e archive/build.
Use estrutura modular: stac_client, resolver, mosaic_builder, storage_client e manifest.
No primeiro momento, implemente fluxo mínimo e mocks controlados onde a conexão real ainda não estiver pronta.
```

---

## Prompt 5 — Comparador

```text
Implemente a Fase 2: Linha do Tempo e Comparador Temporal.
Use mosaicos existentes do acervo.
Crie timeline, galeria por ano, seleção antes/depois, slider e salvar comparação como evidência.
```

---

## Prompt 6 — Inteligência Ambiental

```text
Implemente a Fase 3: Detecção de Mudanças.
Crie APIs, modelo ChangeAnalysis, UI de análise e worker de inteligência.
Gerar resultados com polígonos GeoJSON, área em hectares, preview e manifest.
```

---

## Prompt 7 — Fiscalização Preventiva

```text
Implemente a Fase 4: Fiscalização Preventiva.
Crie FiscalFinding, motor de regras, tela de achados, mapa e status.
Comece com APP, Reserva Legal, PRODES e MapBiomas quando as camadas existirem no projeto.
```
