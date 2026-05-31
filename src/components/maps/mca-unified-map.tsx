"use client";

import * as React from "react";
import { GeoJSON, MapContainer, TileLayer, FeatureGroup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import type { FeatureCollection } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import type { StudyAreaGeoJSON } from "./study-area-map";

// @ts-expect-error Leaflet default icon workaround
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const LAYER_STYLE: Record<string, { color: string; fillColor?: string; weight: number }> = {
  FUND_: { color: "#f8fafc", weight: 3 },
  USO_: { color: "#16a34a", fillColor: "#22c55e", weight: 2 },
  HYD_: { color: "#2563eb", weight: 2 },
  AMB_: { color: "#7c3aed", fillColor: "#a78bfa", weight: 2 },
  INFRA_: { color: "#ea580c", fillColor: "#fb923c", weight: 2 },
  CTX_: { color: "#64748b", weight: 2 },
};

function styleForLayerId(layerId: string): L.PathOptions {
  const prefix = Object.keys(LAYER_STYLE).find((p) => layerId.startsWith(p));
  const base = prefix ? LAYER_STYLE[prefix] : { color: "#94a3b8", weight: 1 };
  return {
    color: base.color,
    fillColor: base.fillColor ?? base.color,
    fillOpacity: base.fillColor ? 0.35 : 0,
    weight: base.weight,
  };
}

function FitBounds({
  geo,
  when,
}: {
  geo: StudyAreaGeoJSON | FeatureCollection | null;
  when: string;
}) {
  const map = useMap();
  React.useEffect(() => {
    if (!geo) return;
    try {
      const bounds = L.geoJSON(geo as never).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch {
      /* ignore */
    }
  }, [geo, map, when]);
  return null;
}

export type McaMapMode = "edit" | "preview";

export type McaUnifiedMapProps = {
  mode: McaMapMode;
  perimeter: StudyAreaGeoJSON | null;
  layers?: Record<string, FeatureCollection | null>;
  /** Se definido, só desenha estas layers no modo preview (carregamento sob demanda). */
  visibleLayerKeys?: Set<string>;
  onPolygonChange: (geo: StudyAreaGeoJSON | null) => void;
};

/**
 * Mapa único Leaflet — evita "Map container is already initialized" ao alternar edit/preview.
 */
export function McaUnifiedMap({
  mode,
  perimeter,
  layers,
  visibleLayerKeys,
  onPolygonChange,
}: McaUnifiedMapProps) {
  const handleCreated = (e: { layer: L.Layer }) => {
    const layer = e.layer as L.Layer & { toGeoJSON: () => StudyAreaGeoJSON };
    onPolygonChange(layer.toGeoJSON());
  };

  const handleEdited = (e: { layers: L.LayerGroup }) => {
    e.layers.eachLayer((layer) => {
      const lyr = layer as L.Layer & { toGeoJSON: () => StudyAreaGeoJSON };
      onPolygonChange(lyr.toGeoJSON());
    });
  };

  const handleDeleted = () => {
    onPolygonChange(null);
  };

  const overlayEntries = React.useMemo(() => {
    if (mode !== "preview" || !layers) return [];
    return Object.entries(layers).filter(([k, fc]) => {
      if (k === "BASE_PERIMETRO" || !fc || !fc.features?.length) return false;
      if (visibleLayerKeys && visibleLayerKeys.size > 0) {
        return visibleLayerKeys.has(k);
      }
      return true;
    });
  }, [mode, layers, visibleLayerKeys]);

  const fitGeo: StudyAreaGeoJSON | FeatureCollection | null =
    perimeter ?? overlayEntries[0]?.[1] ?? null;

  return (
    <MapContainer
      center={[-18.5122, -44.555]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {mode === "edit" ? (
        <FeatureGroup>
          <EditControl
            position="topleft"
            onCreated={handleCreated as (e: unknown) => void}
            onEdited={handleEdited as (e: unknown) => void}
            onDeleted={handleDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
            }}
          />
          {perimeter ? (
            <GeoJSON
              key="edit-perimeter"
              data={perimeter as never}
              style={() => ({ color: "#facc15", weight: 3, fillOpacity: 0.08 })}
            />
          ) : null}
        </FeatureGroup>
      ) : (
        <>
          {perimeter ? (
            <GeoJSON
              key="preview-perimeter"
              data={perimeter as never}
              style={() => ({ color: "#facc15", weight: 3, fillOpacity: 0.05 })}
            />
          ) : null}
          {overlayEntries.map(([id, fc]) => (
            <GeoJSON
              key={id}
              data={fc as never}
              style={() => styleForLayerId(id)}
            />
          ))}
        </>
      )}

      {fitGeo ? <FitBounds geo={fitGeo} when={`${mode}-${overlayEntries.length}`} /> : null}
    </MapContainer>
  );
}
