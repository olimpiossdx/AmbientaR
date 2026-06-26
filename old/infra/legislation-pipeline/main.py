"""AmbientaR — Legislation Pipeline (enterprise RAG: ALMG → PostgreSQL/pgvector)."""

from __future__ import annotations

import os
import uuid
from typing import Any, Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from almg import discover_almg, ingest_almg_incremental

app = FastAPI(title="AmbientaR Legislation Pipeline", version="0.1.0")

IngestMode = Literal["discover", "incremental", "full", "reprocess"]


class IngestBody(BaseModel):
    sourceId: str = Field(default="almg-open-data")
    mode: IngestMode = Field(default="incremental")
    limit: int = Field(default=50, ge=1, le=5000)


def _require_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("LEGISLATION_PIPELINE_SECRET") or os.environ.get(
        "WORKER_SHARED_SECRET", ""
    )
    if expected and (x_worker_secret or "") != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "legislation-pipeline",
        "pgvector": os.environ.get("DATABASE_URL", "") != "",
        "almgBase": os.environ.get(
            "ALMG_OPEN_DATA_BASE_URL", "https://dadosabertos.almg.gov.br"
        ),
    }


@app.post("/v1/ingest/run")
async def ingest_run(
    body: IngestBody,
    x_worker_secret: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_secret(x_worker_secret)
    run_id = str(uuid.uuid4())

    if body.sourceId != "almg-open-data":
        raise HTTPException(
            status_code=400,
            detail=f"sourceId {body.sourceId} ainda não implementado no worker",
        )

    if body.mode == "discover":
        discovery = await discover_almg()
        docs = 1 if discovery.get("apiV2Keys") else 0
        return {
            "success": True,
            "runId": run_id,
            "status": "completed",
            "documentsSeen": docs,
            "chunksCreated": 0,
            "message": "Descoberta ALMG via worker Python",
            "discovery": discovery,
        }

    if body.mode in ("incremental", "full", "reprocess"):
        result = await ingest_almg_incremental(
            limit=body.limit if body.mode == "incremental" else min(body.limit, 500)
        )
        return {
            "success": True,
            "runId": run_id,
            "status": "completed",
            "documentsSeen": result.get("documentsSeen", 0),
            "chunksCreated": result.get("chunksCreated", 0),
            "message": result.get("message"),
        }

    raise HTTPException(status_code=400, detail="mode inválido")
