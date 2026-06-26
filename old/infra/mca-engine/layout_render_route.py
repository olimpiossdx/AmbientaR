"""Layout PDF bridge v3 — endpoint também disponível no mca-engine."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from fastapi import Header, HTTPException, Response
from pydantic import BaseModel, Field

# Reutiliza renderer do pacote mca-qgis-worker (monorepo)
_qgis_root = Path(__file__).resolve().parents[1] / "mca-qgis-worker"
if str(_qgis_root) not in sys.path:
    sys.path.insert(0, str(_qgis_root))

from layout_render import render_layout_pdf_bytes  # noqa: E402


class LayoutRenderBody(BaseModel):
    layout_json: dict[str, Any] = Field(..., alias="layoutJson")
    layers: dict[str, Any] = Field(default_factory=dict)
    project_id: str | None = Field(default=None, alias="projectId")


def _require_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("WORKER_SHARED_SECRET", "") or os.environ.get(
        "MCA_WORKER_SECRET", ""
    )
    if expected and (x_worker_secret or "") != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


def render_layout_pdf_route(
    body: LayoutRenderBody,
    x_worker_secret: str | None = Header(default=None),
) -> Response:
    _require_secret(x_worker_secret)
    layout = body.layout_json
    if layout.get("version") != 2:
        raise HTTPException(status_code=400, detail="layoutJson.version must be 2")
    pdf = render_layout_pdf_bytes(layout, body.layers, body.project_id)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"X-MCA-Renderer": "reportlab-bridge"},
    )
