import type { GeographicLocationFields, Project } from "@/lib/types";
import { geographicLocationToBarragemCoordenadas } from "@/lib/barragem/barragem-coordenadas";
import { formatCoordinateBlockForLegacyString } from "@/lib/monitoring-pontos-form";

/** Formata `geographicLocation` para exibição read-only (resumos, PDF, cards). */
export function formatGeographicLocationDisplay(
  geo?: GeographicLocationFields | null,
): string {
  if (!geo) return "";

  const formatted = formatCoordinateBlockForLegacyString(
    geographicLocationToBarragemCoordenadas(geo),
  );
  if (formatted) return formatted;

  if (geo.local?.trim()) return geo.local.trim();
  if (geo.additionalLocationInfo?.trim()) return geo.additionalLocationInfo.trim();

  return "";
}

/** Formata coordenadas do cadastro de empreendimento para exibição. */
export function formatProjectCoordinatesDisplay(
  project?: Project | null,
): string {
  return formatGeographicLocationDisplay(project?.geographicLocation);
}

/** Alias histórico PCA — `empreendimento.coordenadas` no prefill. */
export function formatCoordenadasProject(project: Project): string {
  return formatProjectCoordinatesDisplay(project);
}

/** Resumo para PDF/relatório: empreendimento → fallback lat/lng de ponto de monitoramento. */
export function formatEmpreendimentoCoordinatesForReport(
  project?: Project | null,
  fallbackPonto?: { lat?: number | null; lng?: number | null } | null,
  emptyLabel = "",
): string {
  const fromProject = formatProjectCoordinatesDisplay(project);
  if (fromProject) return fromProject;
  if (fallbackPonto?.lat != null && fallbackPonto?.lng != null) {
    return `${fallbackPonto.lat}, ${fallbackPonto.lng}`;
  }
  return emptyLabel;
}
