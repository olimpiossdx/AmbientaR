# Workers Cloud Run e GDAL — Fiscal Ambiental Digital

## 1. Worker satelital

```text
infra/fiscal-satellite-worker/
```

Responsável por:

- consultar STAC INPE;
- selecionar cenas;
- montar mosaico;
- recortar AOI;
- gerar WebP;
- gerar GeoTIFF/COG;
- salvar no Storage.

---

## 2. Endpoints

```text
GET /health
POST /v1/inpe/availability
POST /v1/inpe/search
POST /v1/archive/build
POST /v1/mosaic/assemble
```

---

## 3. Variáveis

```text
WORKER_SHARED_SECRET
GOOGLE_CLOUD_PROJECT
FIREBASE_STORAGE_BUCKET
INPE_STAC_URL=https://data.inpe.br/bdc/stac/v1/
```

---

## 4. Pipeline assemble

```text
Receber AOI + data/ano
Buscar cenas candidatas
Escolher melhor cena
Resolver pipeline
Ler COG via HTTP range
Fusionar bandas se necessário
Recortar AOI
Gerar preview
Gerar COG
Subir Storage
Retornar manifest
```

---

## 5. Pseudocódigo Python

```py
def assemble_mosaic(payload):
    aoi = payload['aoi']
    year = payload.get('year')
    date = payload.get('date')

    candidates = search_inpe_stac(aoi=aoi, year=year, date=date)
    selected = select_best_scene(candidates)
    pipeline = resolve_pipeline(selected)

    raster = build_raster_from_pipeline(pipeline, aoi)
    clipped = clip_to_aoi(raster, aoi)
    preview = create_webp_preview(clipped)
    cog = create_cog(clipped)

    paths = upload_outputs(preview=preview, cog=cog)
    manifest = build_manifest(selected, pipeline, paths)

    return manifest
```

---

## 6. Worker inteligência

```text
infra/fiscal-intelligence-worker/
```

Responsável por:

- alinhar rasters;
- calcular diferenças;
- gerar polígonos;
- calcular hectares;
- produzir preview e manifest.

---

## 7. Worker relatórios

```text
infra/fiscal-report-worker/
```

Responsável por:

- montar HTML;
- renderizar PDF;
- salvar no Storage;
- devolver path.
