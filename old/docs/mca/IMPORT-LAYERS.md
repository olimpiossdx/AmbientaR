# MCA — Importação de layers GeoJSON (CAD)

Use quando tiver exportado layers do **DWG** para GeoJSON no QGIS, AutoCAD MAP ou similar.

## Formato aceite

```json
{
  "layers": {
    "LAVOURA": { "type": "FeatureCollection", "features": [] },
    "PIVO": { "type": "FeatureCollection", "features": [] },
    "APP": { "type": "FeatureCollection", "features": [] }
  }
}
```

Nomes CAD são mapeados automaticamente — ver [`CAD-LAYER-CATALOG.md`](CAD-LAYER-CATALOG.md).

## Na UI

1. Criar projeto e perímetro  
2. **GeoJSON layers CAD (E06)** → seleccionar ficheiro  
3. **Pipeline completo** ou modo **Layers** no mapa  

## Exemplo no repositório

[`examples/layers-import-exemplo.json`](examples/layers-import-exemplo.json) — polígono de teste (coordenadas MG).

## API

```http
POST /api/mca/projects/{id}/import-layers
Authorization: Bearer {token}
Content-Type: application/json

{ "layers": { ... } }
```

Ou `multipart/form-data` com campo `file`.

## Export após pipeline

```http
GET /api/mca/projects/{id}/export
```

Devolve bundle JSON com `perimeterGeoJson` + todas as `layers`.
