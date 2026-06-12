"""
Cloud Run worker: STAC INPE → preview/GeoTIFF no GCS (Fiscal Ambiental Digital).
MVP: descarrega assets STAC; GDAL completo (recorte/fusão) em iterações futuras.
"""

from __future__ import annotations

import json
import os
import re
import urllib.request
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from google.cloud import storage
from pydantic import BaseModel, Field

INPE_STAC = os.environ.get("INPE_STAC_URL", "https://data.inpe.br/bdc/stac/v1").rstrip("/")

app = FastAPI(title="AmbientaR Fiscal Satellite Worker", version="1.0.0")

PREVIEW_KEYS = ("thumbnail", "preview", "visual", "rendered_preview", "tci", "overview")


class AssembleBody(BaseModel):
    workspace_id: str
    mosaic_id: str
    aoi: dict[str, Any]
    date: str
    stac_item_id: str
    stac_collection: str


def _require_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("WORKER_SHARED_SECRET", "")
    if not expected or (x_worker_secret or "") != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


def _bucket() -> storage.Bucket:
    name = os.environ.get("FIREBASE_STORAGE_BUCKET", "")
    if not name:
        raise HTTPException(status_code=500, detail="FIREBASE_STORAGE_BUCKET not set")
    return storage.Client().bucket(name)


def _fetch_item(collection: str, item_id: str) -> dict[str, Any]:
    url = f"{INPE_STAC}/collections/{collection}/items/{item_id}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _pick_asset_href(item: dict[str, Any], keys: tuple[str, ...]) -> str | None:
    assets = item.get("assets") or {}
    for key in keys:
        href = (assets.get(key) or {}).get("href")
        if href:
            return href
    for key, meta in assets.items():
        href = meta.get("href")
        if href and re.search(r"\.(png|jpe?g|webp|tif(f)?)$", href, re.I):
            return href
        if "thumb" in key.lower() and href:
            return href
    return None


def _download(url: str) -> bytes:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


@app.get("/health")
def health():
    return {"ok": True, "service": "fiscal-satellite-worker"}


@app.post("/v1/mosaic/assemble")
def assemble(body: AssembleBody, x_worker_secret: str | None = Header(default=None)):
    _require_secret(x_worker_secret)
    item = _fetch_item(body.stac_collection, body.stac_item_id)
    preview_href = _pick_asset_href(item, PREVIEW_KEYS)
    if not preview_href:
        raise HTTPException(status_code=422, detail="No preview asset in STAC item")

    prefix = f"fad/{body.workspace_id}/archives/{body.mosaic_id}"
    preview_path = f"{prefix}/preview.webp"
    geotiff_path = f"{prefix}/mosaic_rgb.tif"
    manifest_path = f"{prefix}/manifest.json"

    bucket = _bucket()
    preview_bytes = _download(preview_href)
    bucket.blob(preview_path).upload_from_string(
        preview_bytes,
        content_type="image/jpeg" if ".jp" in preview_href.lower() else "image/png",
    )
    total_bytes = len(preview_bytes)

    geotiff_out: str | None = None
    geotiff_href = _pick_asset_href(item, ("BAND1", "tci", "visual"))
    if geotiff_href and re.search(r"\.tif(f)?$", geotiff_href, re.I):
        try:
            tif_bytes = _download(geotiff_href)
            bucket.blob(geotiff_path).upload_from_string(tif_bytes, content_type="image/tiff")
            geotiff_out = geotiff_path
            total_bytes += len(tif_bytes)
        except Exception:
            pass

    manifest = {
        "stac_item_id": body.stac_item_id,
        "stac_collection": body.stac_collection,
        "preview_source": preview_href,
        "mode": "worker_stac_asset",
    }
    bucket.blob(manifest_path).upload_from_string(
        json.dumps(manifest, indent=2), content_type="application/json"
    )

    return {
        "preview_path": preview_path,
        "geotiff_path": geotiff_out,
        "bytes": total_bytes,
    }
