/**
 * Fase 4 – RAG: consulta ao índice de trechos para a IA.
 * Busca trechos em rag_index (por tipo, órgão ou limite). Busca vetorial (embeddings) fica para implementação futura.
 */

import type { Firestore } from 'firebase/firestore';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import type { RagIndexEntry } from '@/lib/types';

export type RagQueryOptions = {
  /** Máximo de trechos a retornar. */
  maxChunks?: number;
  /** Filtrar por tipo de documento. */
  tipoDocumento?: RagIndexEntry['tipoDocumento'];
  /** Filtrar por UF (ex.: "MG"). */
  uf?: string;
  /** Filtrar por órgão (ex.: "COPAM", "SEMAD"). */
  orgao?: string;
};

const DEFAULT_MAX = 15;

/**
 * Busca trechos no rag_index para enriquecer o contexto da IA.
 * Sem embeddings: retorna trechos recentes ou filtrados por tipo/órgão.
 */
export async function queryRagChunks(
  firestore: Firestore,
  options: RagQueryOptions = {}
): Promise<{ chunkText: string; numero?: string; titulo?: string }[]> {
  const { maxChunks = DEFAULT_MAX, tipoDocumento, uf, orgao } = options;

  const constraints: ReturnType<typeof where>[] = [];
  if (tipoDocumento) constraints.push(where('tipoDocumento', '==', tipoDocumento));
  if (uf) constraints.push(where('uf', '==', uf));
  if (orgao) constraints.push(where('orgao', '==', orgao));

  const q = constraints.length > 0
    ? query(
        collection(firestore, 'rag_index'),
        ...constraints,
        limit(maxChunks)
      )
    : query(
        collection(firestore, 'rag_index'),
        limit(maxChunks)
      );

  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<RagIndexEntry, 'id'>;
    return {
      chunkText: data.chunkText ?? '',
      numero: data.numero,
      titulo: data.titulo,
    };
  }).filter((x) => x.chunkText.length > 0);
}

/**
 * Formata trechos RAG em um único texto para injetar no prompt da IA.
 */
export function formatRagChunksForPrompt(
  chunks: { chunkText: string; numero?: string; titulo?: string }[]
): string {
  if (chunks.length === 0) return '';
  return chunks
    .map((c, i) => {
      const ref = [c.titulo, c.numero].filter(Boolean).join(' – ');
      return `[${i + 1}]${ref ? ` (${ref})` : ''}\n${c.chunkText}`;
    })
    .join('\n\n---\n\n');
}
