"""MCA QGIS Worker v3 — render PDF final a partir de Layout JSON + layers GeoJSON.

Bridge v3: ReportLab stub até PyQGIS headless em produção.
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, Field

from layout_render import render_layout_pdf_bytes
from pyqgis_stub import is_pyqgis_enabled, render_layout_pdf_bytes as pyqgis_render

app = FastAPI(title="AmbientaR MCA QGIS Worker", version="3.0.0")


class LayoutRenderBody(BaseModel):
    layout_json: dict[str, Any] = Field(..., alias="layoutJson")
    layers: dict[str, Any] = Field(default_factory=dict)
    project_id: str | None = Field(default=None, alias="projectId")
    map_image_data_url: str | None = Field(default=None, alias="mapImageDataUrl")


def _require_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("WORKER_SHARED_SECRET", "") or os.environ.get(
        "MCA_WORKER_SECRET", ""
    )
    if expected and (x_worker_secret or "") != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "mca-qgis-worker",
        "renderer": os.environ.get("MCA_QGIS_RENDERER", "reportlab-bridge"),
        "pyqgis": "enabled" if is_pyqgis_enabled() else "0",
    }


@app.post("/v1/layout/render-pdf")
def render_layout_pdf(
    body: LayoutRenderBody,
    x_worker_secret: str | None = Header(default=None),
) -> Response:
    _require_secret(x_worker_secret)
    layout = body.layout_json
    if layout.get("version") != 2:
        raise HTTPException(status_code=400, detail="layoutJson.version must be 2")

    pdf = pyqgis_render(
        layout, body.layers, body.project_id, body.map_image_data_url
    )
    renderer = "pyqgis-stub" if pdf else "reportlab-bridge"
    if pdf is None:
        pdf = render_layout_pdf_bytes(
            layout, body.layers, body.project_id, body.map_image_data_url
        )
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"X-MCA-Renderer": renderer},
    )
