"""Render PDF bridge v3 — partilhado por mca-engine e mca-qgis-worker."""

from __future__ import annotations

import base64
import io
from typing import Any

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def _draw_map_image(c: canvas.Canvas, data_url: str | None, x: float, y: float, w: float, h: float) -> bool:
    if not data_url or not data_url.startswith("data:image"):
        return False
    try:
        header, b64 = data_url.split(",", 1)
        raw = base64.b64decode(b64)
        img = ImageReader(io.BytesIO(raw))
        c.drawImage(img, x, y, width=w, height=h, preserveAspectRatio=True, anchor="sw")
        return True
    except Exception:
        return False


def render_layout_pdf_bytes(
    layout: dict[str, Any],
    layers: dict[str, Any],
    project_id: str | None,
    map_image_data_url: str | None = None,
) -> bytes:
    buf = io.BytesIO()
    page = landscape(A4)
    c = canvas.Canvas(buf, pagesize=page)
    w, h = page

    title = str(layout.get("title") or "MCA — Uso e Ocupação")
    scale = str(layout.get("scale") or "1:12.000")
    prop = (layout.get("meta") or {}).get("propertyName") or project_id or "—"

    c.setFont("Helvetica-Bold", 16)
    c.drawString(36, h - 36, title)
    c.setFont("Helvetica", 10)
    c.drawString(36, h - 52, f"Propriedade: {prop}")
    c.drawString(36, h - 66, f"Escala: {scale} · Renderer: reportlab-bridge (v3)")

    map_drawn = _draw_map_image(c, map_image_data_url, 36, h - 420, w - 280, 320)
    if map_drawn:
        c.setFont("Helvetica", 8)
        c.drawString(36, h - 430, "Mapa composto (satélite + layers) enviado pelo browser.")

    y = h - (430 if map_drawn else 96)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(36, y, "Layers (Layout JSON v2)")
    y -= 18
    c.setFont("Helvetica", 9)
    for key in layout.get("layerOrder") or []:
        fc = layers.get(key) or {}
        n = len(fc.get("features") or [])
        c.drawString(44, y, f"• {key} — {n} feature(s)")
        y -= 13
        if y < 48:
            c.showPage()
            y = h - 48

    legend = layout.get("legend") or []
    if legend and y > 80:
        y -= 8
        c.setFont("Helvetica-Bold", 11)
        c.drawString(36, y, "Legenda")
        y -= 16
        c.setFont("Helvetica", 9)
        for item in legend[:24]:
            c.drawString(
                44,
                y,
                f"{item.get('group', '')}: {item.get('label', item.get('layerKey', ''))}",
            )
            y -= 12
            if y < 48:
                break

    c.setFont("Helvetica-Oblique", 8)
    c.drawString(36, 24, "MCA v3 — PDF bridge (substituir por PyQGIS QgsLayoutExporter em produção)")
    c.save()
    return buf.getvalue()
