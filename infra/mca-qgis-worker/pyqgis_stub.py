"""Stub PyQGIS — activar com MCA_PYQGIS=1 quando imagem QGIS headless estiver disponível."""

from __future__ import annotations

from typing import Any


def is_pyqgis_enabled() -> bool:
    import os

    return os.environ.get("MCA_PYQGIS", "0") in ("1", "true", "yes")


def render_layout_pdf_bytes(
    layout: dict[str, Any],
    layers: dict[str, Any],
    project_id: str | None,
    map_image_data_url: str | None = None,
) -> bytes | None:
    """
    Placeholder para QgsLayoutExporter.
    Retorna None para cair no bridge ReportLab até existir runtime QGIS.
    """
    if not is_pyqgis_enabled():
        return None

    try:
        # Future: from qgis.core import QgsApplication, QgsLayoutExporter, ...
        raise NotImplementedError("PyQGIS headless ainda não empacotado nesta imagem Docker")
    except Exception:
        return None
