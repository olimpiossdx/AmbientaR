/**
 * MCP (camada de dados) – Contexto ambiental por empreendimento.
 *
 * **O que é MCP neste projeto:** camada que sabe buscar dados confiáveis do sistema
 * (cadastro + gestão ambiental + projetos) e entregar para a IA e para o motor de
 * relatórios (DOCX). Não é o protocolo Model Context Protocol; é o “contexto ambiental”
 * estruturado para um empreendimento.
 *
 * Usado pela Fase 3 (preenchimento de templates DOCX) e Fase 4 (fluxos de IA/RAG).
 */

import type { Firestore } from 'firebase/firestore';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import type {
  AmbientalContext,
  Project,
  Empreendedor,
  EnvironmentalCompany,
  License,
  WaterPermit,
  EnvironmentalIntervention,
  FaunaStudy,
  ManualMonitoringLog,
  Tac,
} from '@/lib/types';

const MAX_IN_QUERY = 10;

/**
 * Busca o contexto ambiental completo para um empreendimento (project id).
 * Retorna empreendedor, empreendimento, empresa ambiental, licenças, outorgas,
 * intervenções, fauna, monitoramentos e outros projetos do mesmo empreendedor.
 */
export async function getAmbientalContextByEmpreendimentoId(
  firestore: Firestore,
  empreendimentoId: string
): Promise<AmbientalContext> {
  const result: AmbientalContext = {
    empreendimento: null,
    empreendedor: null,
    empresaAmbiental: null,
    licencas: [],
    tacs: [],
    outorgas: [],
    intervencoes: [],
    faunaStudies: [],
    manualMonitoringLogs: [],
    outrosProjetos: [],
  };

  const projectSnap = await getDoc(doc(firestore, 'projects', empreendimentoId));
  const empreendimento = projectSnap.exists() ? ({ id: projectSnap.id, ...projectSnap.data() } as Project) : null;
  result.empreendimento = empreendimento ?? null;

  const empreendedorId = empreendimento?.empreendedorId;
  if (!empreendedorId) return result;

  const [empreendedorSnap, companySnap, licensesSnap, tacsSnap, outorgasSnap, intervencoesSnap, faunaSnap, projectsSnap] =
    await Promise.all([
      getDoc(doc(firestore, 'empreendedores', empreendedorId)),
      getFirstEnvironmentalCompany(firestore),
      getDocs(
        query(
          collection(firestore, 'licenses'),
          where('empreendedorId', '==', empreendedorId),
          limit(50)
        )
      ),
      getDocs(
        query(
          collection(firestore, 'tacs'),
          where('empreendedorId', '==', empreendedorId),
          limit(50)
        )
      ),
      getDocs(
        query(
          collection(firestore, 'outorgas'),
          where('empreendedorId', '==', empreendedorId),
          limit(50)
        )
      ),
      getDocs(
        query(
          collection(firestore, 'intervencoes'),
          where('empreendedorId', '==', empreendedorId),
          limit(50)
        )
      ),
      getDocs(
        query(
          collection(firestore, 'faunaStudies'),
          where('empreendedorId', '==', empreendedorId),
          limit(50)
        )
      ),
      getDocs(
        query(
          collection(firestore, 'projects'),
          where('empreendedorId', '==', empreendedorId),
          limit(50)
        )
      ),
    ]);

  result.empreendedor = empreendedorSnap.exists()
    ? ({ id: empreendedorSnap.id, ...empreendedorSnap.data() } as Empreendedor)
    : null;
  result.empresaAmbiental = companySnap;
  result.licencas = licensesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as License));
  result.tacs = tacsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Tac));
  result.outorgas = outorgasSnap.docs.map((d) => ({ id: d.id, ...d.data() } as WaterPermit));
  result.intervencoes = intervencoesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EnvironmentalIntervention));
  result.faunaStudies = faunaSnap.docs.map((d) => ({ id: d.id, ...d.data() } as FaunaStudy));

  const allProjects = projectsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
  result.outrosProjetos = allProjects.filter((p) => p.id !== empreendimentoId);

  const outorgaIds = result.outorgas.slice(0, MAX_IN_QUERY).map((o) => o.id);
  if (outorgaIds.length > 0) {
    const logsSnap = await getDocs(
      query(
        collection(firestore, 'manualMonitoringLogs'),
        where('outorgaId', 'in', outorgaIds),
        limit(100)
      )
    );
    result.manualMonitoringLogs = logsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ManualMonitoringLog));
  }

  return result;
}

/**
 * Resumo em texto do contexto ambiental para injetar no prompt da IA (máx. ~2k caracteres).
 */
export function formatAmbientalContextForPrompt(ctx: AmbientalContext): string {
  const parts: string[] = [];
  if (ctx.empreendedor) {
    parts.push(`Empreendedor: ${ctx.empreendedor.name}${ctx.empreendedor.cpfCnpj ? ` (${ctx.empreendedor.cpfCnpj})` : ''}; ${ctx.empreendedor.municipio ?? ''} ${ctx.empreendedor.uf ?? ''}`);
  }
  if (ctx.empreendimento) {
    parts.push(`Empreendimento: ${ctx.empreendimento.propertyName}; Atividade: ${ctx.empreendimento.activity ?? '—'}; ${ctx.empreendimento.municipio ?? ''} ${ctx.empreendimento.uf ?? ''}`);
  }
  if (ctx.empresaAmbiental) {
    parts.push(`Empresa ambiental: ${ctx.empresaAmbiental.name} (${ctx.empresaAmbiental.cnpj})`);
  }
  if (ctx.licencas.length > 0) {
    parts.push(`Licenças: ${ctx.licencas.map((l) => `${l.permitType ?? 'Licença'} ${l.processNumber ?? ''}`).join('; ')}`);
  }
  if (ctx.tacs.length > 0) {
    parts.push(`TACs: ${ctx.tacs.map((t) => t.processNumber ?? t.tacNumber ?? t.id).join('; ')}`);
  }
  if (ctx.outorgas.length > 0) {
    parts.push(`Outorgas: ${ctx.outorgas.map((o) => o.permitNumber ?? o.id).join('; ')}`);
  }
  if (ctx.intervencoes.length > 0) {
    parts.push(`Intervenções: ${ctx.intervencoes.length} registro(s)`);
  }
  if (ctx.faunaStudies.length > 0) {
    parts.push(`Estudos de fauna: ${ctx.faunaStudies.length} registro(s)`);
  }
  const text = parts.join('\n');
  return text.length > 2500 ? text.slice(0, 2500) + '…' : text;
}

async function getFirstEnvironmentalCompany(
  firestore: Firestore
): Promise<EnvironmentalCompany | null> {
  const snap = await getDocs(query(collection(firestore, 'environmentalCompanies'), limit(1)));
  const first = snap.docs[0];
  return first ? ({ id: first.id, ...first.data() } as EnvironmentalCompany) : null;
}
