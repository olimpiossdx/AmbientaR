/**
 * Fase 4 – Fontes de conhecimento (knowledge_sources).
 * Tipos e helpers para registrar leis, normas, TR, laudos antigos. Indexação em rag_index é feita separadamente.
 */

import type { KnowledgeSource, KnowledgeSourceTipo, ModoInclusao } from '@/lib/types';

export type { KnowledgeSource, KnowledgeSourceTipo, ModoInclusao };

/** Labels para exibição. */
export const KNOWLEDGE_SOURCE_TIPO_LABEL: Record<KnowledgeSourceTipo, string> = {
  lei: 'Lei',
  deliberacao: 'Deliberação normativa',
  resolucao: 'Resolução',
  portaria: 'Portaria',
  termo_referencia: 'Termo de referência',
  laudo_antigo: 'Laudo/estudo antigo',
  nota_interna: 'Nota interna',
  outro: 'Outro',
};

/**
 * Resumo em texto de uma fonte para uso em listas ou contexto.
 */
export function formatKnowledgeSourceSummary(source: KnowledgeSource): string {
  const parts = [source.numero ?? source.titulo ?? source.id];
  if (source.orgao) parts.push(source.orgao);
  if (source.assunto) parts.push(source.assunto);
  return parts.join(' – ');
}
