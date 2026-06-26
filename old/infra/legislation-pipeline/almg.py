"""Cliente ALMG Dados Abertos — descoberta e amostragem (rate limit 1 req/s)."""

from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx

BASE = os.environ.get("ALMG_OPEN_DATA_BASE_URL", "https://dadosabertos.almg.gov.br").rstrip(
    "/"
)
LEGISLATION_DOC = f"{BASE}/documentacao/arquivos/legislacao-mineira"


async def _get(client: httpx.AsyncClient, path: str) -> dict[str, Any]:
    await asyncio.sleep(1.1)
    url = path if path.startswith("http") else f"{BASE}{path}"
    res = await client.get(url, headers={"Accept": "application/json"})
    res.raise_for_status()
    return res.json()


async def discover_almg() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        api = await _get(client, "/api/v2/pronunciamentos/tipos")
        await asyncio.sleep(1.1)
        doc = await client.get(LEGISLATION_DOC, headers={"Accept": "text/html"})
        return {
            "apiV2Keys": list(api.keys()) if isinstance(api, dict) else [],
            "legislationDocStatus": doc.status_code,
            "legislationDocUrl": LEGISLATION_DOC,
        }


async def ingest_almg_incremental(limit: int = 50) -> dict[str, Any]:
    """Stub incremental: descobre API + reserva limite para futuro parse CSV → pgvector."""
    discovery = await discover_almg()
    return {
        "documentsSeen": min(limit, 1) if discovery.get("apiV2Keys") else 0,
        "chunksCreated": 0,
        "message": (
            "Stub incremental: conectividade ALMG validada. "
            "Próximo passo: download CSV filtrado + chunk + embedding → legal_chunks."
        ),
        "discovery": discovery,
    }
