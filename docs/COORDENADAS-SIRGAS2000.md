# Coordenadas SIRGAS 2000 — guia de formulários (AmbientaR)

Referência para desenvolvedores após a uniformização **F0–F36**. Objetivo: **entrada única** GMS ou UTM (datum **SIRGAS 2000**, fuso **23S** por omissão em MG) sem alterar paths downstream (Firestore, PDF, mapas, telemetria).

## Princípios

1. **Só mudar a UI de entrada** — persistência existente (`geographicLocation`, `lat`/`lng`, strings `coordenadas`/`utm`, etc.) mantém-se.
2. **Magnitudes positivas na UI** — sinais Sul/Oeste aplicados na derivação decimal (MG).
3. **Datum legado** — se o registo já tem datum ≠ SIRGAS 2000, mostrar opções legadas (`showLegacyDatums`); caso contrário bloquear datum (`lockDatum`).
4. **Decimal derivado no save** — quando o bloco tem `format`/`formato`, o serialize enriquece `decimal` via `enrichCoordinateBlockWithDecimal`.

## Biblioteca (`src/lib/coordinates/`)

| Módulo | Uso |
|--------|-----|
| `constants`, `defaults` | Datum/fuso/formato omissão; `createDefaultCoordinateBlock`, `createDefaultTrechoCoordinateBlock` |
| `dms`, `utm` | Conversões GMS ↔ decimal ↔ UTM 23S |
| `validate` | Validação de blocos |
| `derive-decimal` | `deriveDecimalFromLocationFields`, `enrichGeographicLocationWithDecimal`, `enrichListagemEGeoTrechoWithDecimal`, `enrichProjectFormCoordinates` |

Verificação local:

```bash
npm run coordinates:verify
```

## Componentes (`src/components/coordinates/`)

### `CoordinateInput`

Bloco principal. Props relevantes:

- `basePath` — ex.: `geographicLocation`, `listagemE.geoTrecho.inicio`
- `variant`: `full` | `coords-only` | `trecho-e`
- `formatFieldName`: `format` (empreendimento/RCA/PCA) ou `formato` (trecho E)
- `metadataVariant`: `project` | `listagem`
- `lockDatum`, `showLegacyDatums`

### `TrechoCoordenadasBlock`

Início/fim de trecho (RCA/PCA listagem E). Wrapper sobre `CoordinateInput` `variant="trecho-e"`.

### `CoordinateStringField`

Entrada GMS/UTM com **persistência em string** (`coordenadas`, `utm`, `coordenadas_ponto`). Usa helpers em `src/lib/monitoring-pontos-form.ts` (`parseLegacyCoordenadasString`, `formatCoordinateBlockForLegacyString`).

### `CoordinateStringFormField`

Integração RHF: `form` + `name` → string legada. Usar em listas (pontos de monitoramento §56, ferroligas, etc.).

## Secções partilhadas (RCA / PCA)

```tsx
// RCA — shell listagens A–H (e G sem duplicata em culturas)
import { RcaGeographicLocationSection } from '@/app/(app)/studies/rca/lib/rca-geographic-location-section';

<RcaGeographicLocationSection form={form} metadataVariant="listagem" />

// PCA — listagens A–H (shell + bloco estruturado; B/C/D/F também no formulário principal)
import { PcaGeographicLocationSection } from '@/app/(app)/studies/pca/lib/pca-geographic-location-section';

<PcaGeographicLocationSection form={form} />
```

Shell PCA: resumo read-only em `empreendimento.coordenadas` via `PcaCoordenadasReadOnlyField`; entrada editável no bloco `geographicLocation` acima.

## Serialize Firestore

### RCA (listagens A–H)

Em `rca-project-prefill.ts` de cada listagem:

```typescript
const geo = values.geographicLocation as /* ... */;
const geographicLocation =
  geo?.format != null
    ? enrichCoordinateBlockWithDecimal(geo, 'format')
    : values.geographicLocation;
```

Listagem **E**: também `listagemE.geoTrecho.inicio/fim` com campo `formato`.

### PCA (listagens A–H)

`enrichPcaGeographicLocationForFirestore` em `src/app/(app)/studies/pca/lib/pca-prefill-shared.ts` (serialize em A e nos shells G/H/E; B/C/D/F no formulário principal).

Listagem **E**: também `enrichListagemEGeoTrechoWithDecimal` para `listagemE.geoTrecho.inicio/fim`.

### Empreendimento

`enrichProjectFormCoordinates` no submit de `project-form.tsx`.

## Pontos de monitoramento (outorgas / usos)

- Form: bloco `coordenadas` (GMS/UTM)
- Firestore: `lat`, `lng` numéricos — ver `monitoring-pontos-form.ts`

## Casos especiais

| Caso | Abordagem |
|------|-----------|
| Dispensa PEA `{ latitude, longitude }` strings | `dispensaLatLngToInputString` / `inputStringToDispensaLatLng` (`src/lib/pea/dispensa-coordenadas.ts`) |
| Barragem / cavidades | Form `coordenadas`; submit → strings memorial GMS/UTM (`barragem-coordenadas.ts`) |
| Coleta de campo | `CoordinateStringField` por vértice; Firestore `areaAmarracao[]` string |
| Vistoria | `CoordinateStringField` → `identificacao.coordenadasGeograficas` |
| Mapas / MCA / localizador | Entrada cartográfica ou `lat, lng` — **fora** deste padrão de formulário DN |

## O que não fazer

- Inputs soltos “Latitude” / “Longitude” ou UTM texto livre em formulários novos.
- Duplicar `CoordinateInput` no subformulário **e** no shell (padrão: **shell** para RCA A–H).
- Alterar paths Firestore ou contratos PDF só por causa da UI.
- Reintroduzir arrays mortos `datums` / `fusos` nos formulários.

## Checklist para novo formulário

1. Identificar path de persistência (bloco `geographicLocation`, string, ou `lat`/`lng`).
2. Escolher `CoordinateInput`, `CoordinateStringField` ou secção RCA/PCA.
3. Prefill a partir de `project.geographicLocation` quando aplicável.
4. No serialize, chamar enrich adequado se existir bloco com `format`.
5. Correr `npm run coordinates:verify` após mudanças na lib.

## Histórico de fases (resumo)

| Fases | Escopo |
|-------|--------|
| F0–F3 | Lib + `CoordinateInput` + piloto empreendimento |
| F4–F17 | RCA/PCA licenciamento, trecho E, outorgas |
| F18–F29 | RCA listagens A/B/G, rochas, serialize |
| F30–F33 | RCA C–H, PCA A, shell listagem A/G |
| F34–F35 | Pontos hídricos §56, ferroligas, dispensa PEA |
| F36 | Revisão final + verify |
| F37 | Este documento |
