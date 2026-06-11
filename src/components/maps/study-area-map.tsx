"use client";

import * as React from "react";
import { TileLayer, FeatureGroup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import { LeafletMapShell } from "./leaflet-map-shell";

export type StudyAreaGeoJSON = {
  type: string;
  [key: string]: unknown;
};

const MapUpdater = ({ polygon }: { polygon: StudyAreaGeoJSON }) => {
  const map = useMap();
  React.useEffect(() => {
    if (polygon) {
      try {
        const bounds = L.geoJSON(polygon as never).getBounds();
        if (bounds.isValid()) map.fitBounds(bounds);
      } catch {
        /* ignore */
      }
    }
  }, [polygon, map]);
  return null;
};

export type StudyAreaMapProps = {
  polygon: StudyAreaGeoJSON | null;
  onPolygonChange: (geo: StudyAreaGeoJSON | null) => void;
};

/**
 * Mapa de desenho do perímetro — submenu Mapas (Estudos Técnicos / MCA).
 * Basemap satélite Esri + polígono editável.
 */
export function StudyAreaMap({ polygon, onPolygonChange }: StudyAreaMapProps) {
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

  return (
    <LeafletMapShell
      center={[-18.5122, -44.555]}
      zoom={5}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/en-us/home">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
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
        {polygon ? <MapUpdater polygon={polygon} /> : null}
      </FeatureGroup>
    </LeafletMapShell>
  );
}
