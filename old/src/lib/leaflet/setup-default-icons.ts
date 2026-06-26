import L from "leaflet";

let configured = false;

/** Configura ícones padrão do Leaflet (paths em /public/leaflet). Idempotente. */
export function setupLeafletDefaultIcons(): void {
  if (configured || typeof window === "undefined") return;
  configured = true;

  // @ts-expect-error Leaflet default icon workaround
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}
