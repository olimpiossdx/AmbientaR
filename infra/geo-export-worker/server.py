"""
Cloud Run worker: GeoJSON (GCS) -> Shapefile ZIP + DXF + GPKG + opcional OSM (Overpass).
Autenticação: header X-Worker-Secret == env WORKER_SHARED_SECRET (alinhado à API Next).
"""

from __future__ import annotations

import json
import os
import re
import urllib.parse
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from google.cloud import storage
from pydantic import BaseModel, Field

app = FastAPI(title="AmbientaR Geo Export Worker", version="1.0.0")


class ExportBody(BaseModel):
    job_id: str = Field(..., min_length=4, max_length=128)
    input_gcs_uri: str = Field(..., description="gs://bucket/path/input.geojson")
    output_gcs_prefix: str = Field(
        ..., description="gs://bucket/prefix/ (termina com /)"
    )
    fetch_osm: bool = False
    target_crs: str = "EPSG:31983"  # SIRGAS 2000 / UTM 23S — MG comum; pode ser 4326


def _require_secret(x_worker_secret: str | None) -> None:
    expected = os.environ.get("WORKER_SHARED_SECRET", "")
    if not expected or (x_worker_secret or "") != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


def _parse_gs_uri(uri: str) -> tuple[str, str]:
    m = re.match(r"^gs://([^/]+)/(.+)$", uri.strip())
    if not m:
        raise HTTPException(status_code=400, detail="Invalid gs:// URI")
    return m.group(1), m.group(2).rstrip("/")


def _walk_coords(obj: Any, acc: list[tuple[float, float]]) -> None:
    if isinstance(obj, list):
        if obj and isinstance(obj[0], (int, float)):
            if len(obj) >= 2:
                acc.append((float(obj[0]), float(obj[1])))
        else:
            for x in obj:
                _walk_coords(x, acc)
    elif isinstance(obj, dict):
        for v in obj.values():
            _walk_coords(v, acc)


def geojson_bbox(gj: dict[str, Any]) -> tuple[float, float, float, float]:
    acc: list[tuple[float, float]] = []
    _walk_coords(gj, acc)
    if not acc:
        raise ValueError("No coordinates in GeoJSON")
    xs = [p[0] for p in acc]
    ys = [p[1] for p in acc]
    return min(ys), min(xs), max(ys), max(xs)  # south, west, north, east


def fetch_overpass_osm(south: float, west: float, north: float, east: float) -> bytes:
    # bbox Overpass: south west north east
    query = f"""
[out:json][timeout:120];
(
  way["highway"]({south},{west},{north},{east});
  way["building"]({south},{west},{north},{east});
  way["waterway"]({south},{west},{north},{east});
);
(._;>;);
out body;
""".strip()
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return resp.read()


def osm_json_to_geojson(data: bytes) -> dict[str, Any]:
    """Converte resposta Overpass JSON num FeatureCollection simples (ways como LineString)."""
    root = json.loads(data.decode("utf-8"))
    elements = root.get("elements", [])
    nodes: dict[int, tuple[float, float]] = {}
    ways: list[dict[str, Any]] = []
    for el in elements:
        t = el.get("type")
        if t == "node":
            nodes[el["id"]] = (float(el["lon"]), float(el["lat"]))
        elif t == "way" and "nodes" in el:
            ways.append(el)
    feats: list[dict[str, Any]] = []
    for w in ways:
        coords: list[list[float]] = []
        for nid in w.get("nodes", []):
            if nid in nodes:
                lon, lat = nodes[nid]
                coords.append([lon, lat])
        if len(coords) < 2:
            continue
        props = {k: v for k, v in w.items() if k not in ("type", "id", "nodes")}
        feats.append(
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": coords},
                "properties": props,
            }
        )
    return {"type": "FeatureCollection", "features": feats}


def run_ogr(args: list[str]) -> None:
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"ogr2ogr failed: {r.stderr or r.stdout}")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/export")
def export_job(
    body: ExportBody,
    x_worker_secret: str | None = Header(default=None, alias="X-Worker-Secret"),
) -> dict[str, Any]:
    _require_secret(x_worker_secret)

    in_bucket, in_key = _parse_gs_uri(body.input_gcs_uri)
    out_bucket, out_prefix = _parse_gs_uri(body.output_gcs_prefix.rstrip("/"))

    client = storage.Client()
    tmp = Path(tempfile.mkdtemp(prefix="geoexport_"))
    try:
        in_path = tmp / "input.geojson"
        blob = client.bucket(in_bucket).blob(in_key)
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Input object not found")
        in_path.write_bytes(blob.download_as_bytes())

        gj = json.loads(in_path.read_text(encoding="utf-8"))
        # Export CAD/SIG usa sempre o perímetro do imóvel; OSM é camada extra opcional.
        parcel_path = in_path
        osm_context_path: Path | None = None

        if body.fetch_osm:
            try:
                s, w, n, e = geojson_bbox(gj)
                raw = fetch_overpass_osm(s, w, n, e)
                osm_fc = osm_json_to_geojson(raw)
                osm_path = tmp / "osm_raw.geojson"
                osm_path.write_text(
                    json.dumps(osm_fc, ensure_ascii=False), encoding="utf-8"
                )
                clipped = tmp / "osm_clipped.geojson"
                run_ogr(
                    [
                        "ogr2ogr",
                        "-f",
                        "GeoJSON",
                        str(clipped),
                        str(osm_path),
                        "-clipsrc",
                        str(parcel_path),
                    ]
                )
                osm_context_path = clipped
            except Exception as ex:  # noqa: BLE001
                (tmp / "osm_warning.txt").write_text(str(ex), encoding="utf-8")

        shp_dir = tmp / "shp"
        shp_dir.mkdir()
        run_ogr(
            [
                "ogr2ogr",
                "-t_srs",
                body.target_crs,
                "-f",
                "ESRI Shapefile",
                str(shp_dir / "parcela.shp"),
                str(parcel_path),
            ]
        )
        zip_path = tmp / "export.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for p in shp_dir.iterdir():
                zf.write(p, arcname=p.name)

        dxf_path = tmp / "parcela.dxf"
        run_ogr(
            [
                "ogr2ogr",
                "-t_srs",
                body.target_crs,
                "-f",
                "DXF",
                str(dxf_path),
                str(parcel_path),
            ]
        )

        gpkg_path = tmp / "parcela.gpkg"
        run_ogr(
            [
                "ogr2ogr",
                "-t_srs",
                body.target_crs,
                "-f",
                "GPKG",
                str(gpkg_path),
                str(parcel_path),
            ]
        )

        out_b = client.bucket(out_bucket)
        base = f"{out_prefix}/{body.job_id}"
        artifacts: list[dict[str, str]] = []
        uploads: list[tuple[str, Path]] = [
            ("export.zip", zip_path),
            ("parcela.dxf", dxf_path),
            ("parcela.gpkg", gpkg_path),
        ]
        if osm_context_path and osm_context_path.exists():
            uploads.append(("osm_context.geojson", osm_context_path))

        for name, path in uploads:
            dest = out_b.blob(f"{base}/{name}")
            dest.upload_from_filename(str(path))
            artifacts.append({"name": name, "gcs_uri": f"gs://{out_bucket}/{base}/{name}"})

        warn = ""
        wp = tmp / "osm_warning.txt"
        if wp.exists():
            warn = wp.read_text(encoding="utf-8")[:2000]

        return {
            "ok": True,
            "job_id": body.job_id,
            "artifacts": artifacts,
            "osm_warning": warn or None,
        }
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
