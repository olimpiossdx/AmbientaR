import type { InterventionChecklistLinkKey } from "@/lib/intervention-checklist";
import type { AiaLinkedArtifacts } from "@/lib/types";

export type AiaLinkParams = {
  requestId?: string;
  projectId?: string;
  empreendedorId?: string;
  linked?: AiaLinkedArtifacts;
};

export function buildAiaModuleHref(
  linkKey: InterventionChecklistLinkKey,
  params: AiaLinkParams,
): string {
  const q = new URLSearchParams();
  if (params.requestId) q.set("requestId", params.requestId);
  if (params.projectId) q.set("projectId", params.projectId);
  if (params.empreendedorId) q.set("empreendedorId", params.empreendedorId);
  const qs = q.toString();
  const suffix = qs ? `?${qs}` : "";

  switch (linkKey) {
    case "pia": {
      const piaId = params.linked?.piaId;
      if (piaId) return `/studies/intervencao-ambiental/${piaId}/edit${suffix}`;
      return `/studies/intervencao-ambiental/new?type=Simplificado${qs ? `&${qs}` : ""}`;
    }
    case "inventory": {
      const invId = params.linked?.inventoryId;
      if (invId) return `/studies/inventario/${invId}${suffix}`;
      return `/studies/inventario${suffix}`;
    }
    case "mapas":
      return `/studies/mapas${suffix}`;
    case "georef": {
      const geoId = params.linked?.georefProjectId;
      if (geoId) return `/georeferenciamento/processos/${geoId}${suffix}`;
      return `/georeferenciamento/processos${suffix}`;
    }
    case "prada":
      return `/studies/prada/new${suffix}`;
    case "ptrf":
      return `/studies/relatorios-diversos/ptrf-prad${suffix}`;
    case "fauna":
      return `/studies/fauna/inventario${suffix}`;
    default:
      return `/requests${suffix}`;
  }
}
