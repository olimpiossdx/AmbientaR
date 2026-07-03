import type { StudyExportRecord } from '@/lib/studies/study-export-record';

/** Documento técnico salvo no Firestore (RCA, PCA, LAS-RAS, reanálise, etc.). */
export type StudyFirestoreDocument = StudyExportRecord & {
  id: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Origem do formulário: dinâmico (TR) ou estático simplificado. */
  formSource?: 'dynamic' | 'static';
};

export function getStudyDocEmpreendimentoNome(doc: StudyExportRecord): string {
  const emp = doc.empreendimento;
  if (emp && typeof emp === 'object') {
    const nome = emp.nome?.trim();
    if (nome) return nome;
    const denom = (emp as { denominacao?: string }).denominacao?.trim();
    if (denom) return denom;
  }
  const flat = (doc as Record<string, unknown>).empreendimentoNome;
  if (typeof flat === 'string' && flat.trim()) return flat.trim();
  return 'Sem nome';
}

export function getStudyDocRequerenteNome(
  doc: StudyExportRecord,
  empreendedoresMap?: Map<string, string>,
): string {
  const req = (doc.empreendedor ?? doc.requerente) as
    | { clientId?: string; nome?: string }
    | null
    | undefined;
  if (req && typeof req === 'object') {
    const clientId = req.clientId;
    if (clientId && empreendedoresMap?.get(clientId)) {
      return empreendedoresMap.get(clientId)!;
    }
    const nome = req.nome?.trim();
    if (nome) return nome;
  }
  return 'Não informado';
}

export function getStudyDocActivity(doc: StudyExportRecord): string | null {
  if (doc.activity?.trim()) return doc.activity.trim();
  const emp = doc.empreendimento;
  if (emp && typeof emp === 'object') {
    const act = (emp as { activity?: string; atividade?: string }).activity
      ?? (emp as { atividade?: string }).atividade;
    if (typeof act === 'string' && act.trim()) return act.trim();
  }
  const nested = (doc as Record<string, unknown>).empreendimento as Record<string, unknown> | undefined;
  const fromNested = nested?.atividade ?? nested?.activity;
  if (typeof fromNested === 'string' && fromNested.trim()) return fromNested.trim();
  return null;
}

export function isLasRasStaticRecord(doc: StudyExportRecord): boolean {
  const d = doc as Record<string, unknown>;
  return Boolean(d.ras) || typeof d.caracterizacaoEmpreendimento === 'string';
}
