"""MCA Engine — health, registry, DAG (auxiliar à orquestração TypeScript)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, Field

from dag import resolve_agent_order
from layout_render_route import LayoutRenderBody, render_layout_pdf_route

app = FastAPI(title="AmbientaR MCA Engine", version="1.0.0")

REGISTRY_PATH = Path(__file__).parent / "mca_agent_registry.yaml"


def _load_registry() -> dict[str, Any]:
    with REGISTRY_PATH.open(encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("agents") or {}


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
        "service": "mca-engine",
        "debug": os.environ.get("MCA_DEBUG", "0"),
        "agents": str(len(_load_registry())),
    }


@app.get("/v1/registry")
def get_registry() -> dict[str, Any]:
    return {"agents": _load_registry()}


class DagBody(BaseModel):
    agent_ids: list[str] | None = Field(default=None, alias="agentIds")


@app.post("/v1/dag/resolve")
def post_dag_resolve(body: DagBody) -> dict[str, Any]:
    agents = _load_registry()
    order = resolve_agent_order(agents, body.agent_ids)
    return {"order": order, "count": len(order)}


ETAPA_CHECKS: dict[int, list[str]] = {
    1: ["REFERENCIA-PIMENTA.md exists"],
    2: ["GET /health returns 200"],
    3: ["DAG resolve all agents without cycle"],
    4: ["mca_projects CRUD"],
    5: ["perimeter valid", "CRS EPSG:31983"],
}


@app.get("/v1/debug/etapa/{etapa}")
def debug_etapa(etapa: int) -> dict[str, Any]:
    return {
        "etapa": etapa,
        "checks": ETAPA_CHECKS.get(etapa, ["see docs/mca/ETAPAS.md"]),
        "registry_agents": len(_load_registry()),
    }


@app.post("/v1/layout/render-pdf")
def post_layout_render_pdf(
    body: LayoutRenderBody,
    x_worker_secret: str | None = Header(default=None),
) -> Response:
    return render_layout_pdf_route(body, x_worker_secret)


@app.post("/v1/debug/agent")
def debug_agent_stub(
    agent_id: str,
    x_worker_secret: str | None = Header(default=None),
) -> dict[str, Any]:
    _require_secret(x_worker_secret)
    agents = _load_registry()
    if agent_id not in agents:
        raise HTTPException(status_code=404, detail="Unknown agent_id")
    return {"agent_id": agent_id, "meta": agents[agent_id], "status": "stub_ok"}
