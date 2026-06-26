"""
Cloud Run worker: detecção de mudanças em previews CBERS (FAD Fase 3).
Alinha previews, calcula diff RGB, classifica células e devolve polígonos GeoJSON.
"""

from __future__ import annotations

import io
import json
import math
import os
from typing import Any

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from google.cloud import storage
from PIL import Image
from pydantic import BaseModel

app = FastAPI(title="AmbientaR Fiscal Intelligence Worker", version="1.0.0")

GRID = 10
DIFF_THRESHOLD = 22.0


class DetectBody(BaseModel):
    workspace_id: str
    analysis_id: str
    aoi: dict[str, Any]
    bbox: list[float]
    before_preview_path: str
    after_preview_path: str


def _require_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("WORKER_SHARED_SECRET", "")
    if not expected or (x_worker_secret or "") != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


def _bucket() -> storage.Bucket:
    name = os.environ.get("FIREBASE_STORAGE_BUCKET", "")
    if not name:
        raise HTTPException(status_code=500, detail="FIREBASE_STORAGE_BUCKET not set")
    return storage.Client().bucket(name)


def _download_blob(path: str) -> bytes:
    return _bucket().blob(path).download_as_bytes()


def _ha_for_cell(bbox: list[float], gx: int, gy: int, grid: int) -> float:
    min_lon, min_lat, max_lon, max_lat = bbox
    dx = (max_lon - min_lon) / grid
    dy = (max_lat - min_lat) / grid
    lat_mid = min_lat + (gy + 0.5) * dy
    m_per_deg_lat = 111_320.0
    m_per_deg_lon = 111_320.0 * math.cos(math.radians(lat_mid))
    area_m2 = (dx * m_per_deg_lon) * (dy * m_per_deg_lat)
    return max(0.0, area_m2 / 10_000.0)


def _cell_polygon(bbox: list[float], gx: int, gy: int, grid: int) -> dict[str, Any]:
    min_lon, min_lat, max_lon, max_lat = bbox
    dx = (max_lon - min_lon) / grid
    dy = (max_lat - min_lat) / grid
    x0 = min_lon + gx * dx
    x1 = min_lon + (gx + 1) * dx
    y0 = min_lat + gy * dy
    y1 = min_lat + (gy + 1) * dy
    return {
        "type": "Polygon",
        "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
    }


def _green_index(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (g - r) / (g + r + 1.0)


@app.get("/health")
def health():
    return {"ok": True, "service": "fiscal-intelligence-worker"}


@app.post("/v1/change/detect")
def detect(body: DetectBody, x_worker_secret: str | None = Header(default=None)):
    _require_secret(x_worker_secret)

    before_bytes = _download_blob(body.before_preview_path)
    after_bytes = _download_blob(body.after_preview_path)

    before = np.array(Image.open(io.BytesIO(before_bytes)).convert("RGB").resize((256, 256)), dtype=float)
    after = np.array(Image.open(io.BytesIO(after_bytes)).convert("RGB").resize((256, 256)), dtype=float)

    diff = np.abs(after - before).mean(axis=2)
    delta_green = _green_index(after) - _green_index(before)

    polygons: list[dict[str, Any]] = []
    loss_ha = gain_ha = bare_ha = 0.0

    for gy in range(GRID):
        for gx in range(GRID):
            y0, y1 = gy * 256 // GRID, (gy + 1) * 256 // GRID
            x0, x1 = gx * 256 // GRID, (gx + 1) * 256 // GRID
            cell_diff = float(diff[y0:y1, x0:x1].mean())
            if cell_diff < DIFF_THRESHOLD:
                continue

            cell_delta = float(delta_green[y0:y1, x0:x1].mean())
            if cell_delta < -0.04:
                kind = "vegetation_loss"
            elif cell_delta > 0.04:
                kind = "vegetation_gain"
            else:
                kind = "bare_soil_exposure"

            area_ha = round(_ha_for_cell(body.bbox, gx, gy, GRID), 2)
            if area_ha < 0.01:
                continue

            conf = min(0.92, 0.5 + cell_diff / 80.0)
            polygons.append(
                {
                    "type": kind,
                    "geometry": _cell_polygon(body.bbox, gx, gy, GRID),
                    "area_ha": area_ha,
                    "confidence": round(conf, 2),
                }
            )

            if kind == "vegetation_loss":
                loss_ha += area_ha
            elif kind == "vegetation_gain":
                gain_ha += area_ha
            else:
                bare_ha += area_ha

    # heatmap preview
    heat = np.clip(diff / 80.0 * 255, 0, 255).astype(np.uint8)
    heat_rgb = np.stack([heat, np.zeros_like(heat), (255 - heat)], axis=2)
    heat_img = Image.fromarray(heat_rgb, mode="RGB")

    prefix = f"fad/{body.workspace_id}/analyses/{body.analysis_id}"
    preview_path = f"{prefix}/change_preview.webp"
    mask_path = f"{prefix}/change_mask.png"

    buf = io.BytesIO()
    heat_img.save(buf, format="WEBP", quality=85)
    _bucket().blob(preview_path).upload_from_string(buf.getvalue(), content_type="image/webp")

    mask_buf = io.BytesIO()
    heat_img.save(mask_buf, format="PNG")
    _bucket().blob(mask_path).upload_from_string(mask_buf.getvalue(), content_type="image/png")

    total = round(loss_ha + gain_ha + bare_ha, 2)
    confidence = round(min(0.9, 0.55 + len(polygons) * 0.03), 2) if polygons else 0.25

    return {
        "polygons": polygons,
        "summary": {
            "loss_ha": round(loss_ha, 2),
            "gain_ha": round(gain_ha, 2),
            "bare_ha": round(bare_ha, 2),
            "total_changed_ha": total,
        },
        "preview_path": preview_path,
        "mask_path": mask_path,
        "confidence": confidence,
    }
