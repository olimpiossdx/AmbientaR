"use client";

import * as React from "react";
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import type { InfluenceDrawTarget } from "@/components/geospatial/geo-influence-areas-panel";

// @ts-expect-error leaflet icon workaround
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

type GeoJSONLike = {
  type: string;
  [key: string]: unknown;
};

const ADA_STYLE: L.PathOptions = {
  color: "#ca8a04",
  weight: 3,
  fillColor: "#facc15",
  fillOpacity: 0.25,
};

const AID_STYLE: L.PathOptions = {
  color: "#0891b2",
  weight: 2,
  fillColor: "#22d3ee",
  fillOpacity: 0.15,
  dashArray: "6 4",
};

const AII_STYLE: L.PathOptions = {
  color: "#0f172a",
  weight: 2,
  fillColor: "#64748b",
  fillOpacity: 0.08,
  dashArray: "3 5",
};

interface LeafletMapProps {
  adaPolygon: GeoJSONLike | null;
  onAdaChange: (geoJSON: GeoJSONLike | null) => void;
  aidPolygon?: GeoJSONLike | null;
  onAidChange?: (geoJSON: GeoJSONLike | null) => void;
  aiiPolygon?: GeoJSONLike | null;
  onAiiChange?: (geoJSON: GeoJSONLike | null) => void;
  drawTarget?: InfluenceDrawTarget;
}

const MapUpdater = ({ polygons }: { polygons: GeoJSONLike[] }) => {
  const map = useMap();
  React.useEffect(() => {
    const valid = polygons.filter(Boolean);
    if (!valid.length) return;
    try {
      const group = L.featureGroup(valid.map((p) => L.geoJSON(p as any)));
      const bounds = group.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch (error) {
      console.error("Error fitting bounds:", error);
    }
  }, [polygons, map]);
  return null;
};

function ReadOnlyLayer({
  data,
  style,
}: {
  data: GeoJSONLike | null | undefined;
  style: L.PathOptions;
}) {
  if (!data) return null;
  return (
    <GeoJSON
      key={JSON.stringify(data).slice(0, 120)}
      data={data as any}
      style={() => style}
    />
  );
}

const LeafletMap = ({
  adaPolygon,
  onAdaChange,
  aidPolygon,
  onAidChange,
  aiiPolygon,
  onAiiChange,
  drawTarget = "ada",
}: LeafletMapProps) => {
  const adaGroupRef = React.useRef<L.FeatureGroup>(null);
  const aidGroupRef = React.useRef<L.FeatureGroup>(null);
  const aiiGroupRef = React.useRef<L.FeatureGroup>(null);

  const activeRef =
    drawTarget === "aid"
      ? aidGroupRef
      : drawTarget === "aii"
        ? aiiGroupRef
        : adaGroupRef;

  const handleChange = (geo: GeoJSONLike | null) => {
    if (drawTarget === "aid") onAidChange?.(geo);
    else if (drawTarget === "aii") onAiiChange?.(geo);
    else onAdaChange(geo);
  };

  const handleCreated = (e: { layer: L.Layer & { toGeoJSON?: () => GeoJSONLike } }) => {
    handleChange(e.layer.toGeoJSON?.() ?? null);
  };

  const handleEdited = (e: { layers: L.LayerGroup }) => {
    e.layers.eachLayer((layer: L.Layer & { toGeoJSON?: () => GeoJSONLike }) => {
      handleChange(layer.toGeoJSON?.() ?? null);
    });
  };

  const handleDeleted = () => {
    handleChange(null);
  };

  const fitPolygons = [adaPolygon, aidPolygon, aiiPolygon].filter(Boolean) as GeoJSONLike[];

  return (
    <MapContainer
      center={[-18.5122, -44.555]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      {adaPolygon ? <ReadOnlyLayer data={adaPolygon} style={ADA_STYLE} /> : null}
      {aidPolygon ? <ReadOnlyLayer data={aidPolygon} style={AID_STYLE} /> : null}
      {aiiPolygon ? <ReadOnlyLayer data={aiiPolygon} style={AII_STYLE} /> : null}

      <FeatureGroup ref={activeRef}>
        <EditControl
          position="topleft"
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: true,
          }}
        />
      </FeatureGroup>

      {fitPolygons.length ? <MapUpdater polygons={fitPolygons} /> : null}
    </MapContainer>
  );
};

export default LeafletMap;
