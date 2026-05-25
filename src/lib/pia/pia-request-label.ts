import { PROCESSOS_STATUS_OPTIONS } from '@/lib/processos-form-order';
import type { Request } from '@/lib/types';

export type RequestLabelMaps = {
  clientNameById: Map<string, string>;
  projectNameById: Map<string, string>;
};

export function buildMapsFromClientsAndProjects(
  clients: { id: string; name?: string | null }[],
  projects: { id: string; propertyName?: string | null; fantasyName?: string | null }[],
): RequestLabelMaps {
  const clientNameById = new Map<string, string>();
  for (const c of clients) {
    if (c.id && c.name?.trim()) clientNameById.set(c.id, c.name.trim());
  }
  const projectNameById = new Map<string, string>();
  for (const p of projects) {
    const label = (p.fantasyName || p.propertyName || '').trim();
    if (p.id && label) projectNameById.set(p.id, label);
  }
  return { clientNameById, projectNameById };
}

export function formatRequestProcessLabel(
  request: Request,
  maps: RequestLabelMaps,
): string {
  const empreendedor =
    maps.clientNameById.get(request.empreendedorId) || 'Empreendedor não identificado';
  const empreendimento =
    maps.projectNameById.get(request.projectId) || 'Empreendimento não identificado';
  const statusPt =
    PROCESSOS_STATUS_OPTIONS.find((o) => o.value === request.status)?.label ??
    request.status;
  return `${empreendedor} — ${empreendimento} (${statusPt})`;
}

export function sortRequestsForDisplay(
  requests: Request[],
  maps: RequestLabelMaps,
): Request[] {
  return [...requests].sort((a, b) =>
    formatRequestProcessLabel(a, maps).localeCompare(
      formatRequestProcessLabel(b, maps),
      'pt-BR',
    ),
  );
}
