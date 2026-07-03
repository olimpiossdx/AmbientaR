import type {
  GeorefProject,
  GeorefStatus,
  GeorefTipo,
  GeorefVertice,
} from "@/lib/georeferenciamento/types";

export function mapGeorefProjectDoc(
  id: string,
  data: Record<string, unknown>,
): GeorefProject {
  return {
    id,
    title: String(data.title ?? ""),
    tipo: (data.tipo as GeorefTipo) ?? "rural",
    status: (data.status as GeorefStatus) ?? "prospeccao",
    requestId: data.requestId as string | undefined,
    clientId: data.clientId as string | undefined,
    clientName: data.clientName as string | undefined,
    projectId: data.projectId as string | undefined,
    projectName: data.projectName as string | undefined,
    municipio: data.municipio as string | undefined,
    uf: data.uf as string | undefined,
    matricula: data.matricula as string | undefined,
    car: data.car as string | undefined,
    ccir: data.ccir as string | undefined,
    cnsCartorio: data.cnsCartorio as string | undefined,
    areaHa: data.areaHa as number | undefined,
    responsavelTecnico: data.responsavelTecnico as string | undefined,
    crea: data.crea as string | undefined,
    artRrt: data.artRrt as string | undefined,
    sigefParcelaId: data.sigefParcelaId as string | undefined,
    checklist: (data.checklist as GeorefProject["checklist"]) ?? {},
    notes: data.notes as string | undefined,
    polygonGeojson: data.polygonGeojson as object | undefined,
    vertices: data.vertices as GeorefVertice[] | undefined,
    verticesMeta: data.verticesMeta as GeorefProject["verticesMeta"],
    localizacaoImovel: data.localizacaoImovel as GeorefProject["localizacaoImovel"],
    createdBy: String(data.createdBy ?? ""),
    createdAt: String(data.createdAt ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}
