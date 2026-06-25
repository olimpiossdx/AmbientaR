import type { ProjectPerimetroReferencia } from '@/lib/types';

/**
 * Remove `undefined` em profundidade — Firestore rejeita campos undefined no addDoc/updateDoc.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) {
    return undefined as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (nested === undefined) continue;
    const cleaned = stripUndefinedDeep(nested);
    if (cleaned !== undefined) {
      out[key] = cleaned;
    }
  }
  return out as T;
}

/**
 * Firestore não aceita arrays aninhados (ex.: coordenadas GeoJSON em polígonos).
 * O arquivo do perímetro fica no Storage; a geometria é re-lida pelo fileUrl quando necessário.
 */
export function perimetroReferenciaForFirestore(
  perimetro: ProjectPerimetroReferencia | undefined,
): ProjectPerimetroReferencia | undefined {
  if (!perimetro) return undefined;
  const { geojson: _geojson, ...rest } = perimetro;
  if (Object.keys(rest).length === 0) return undefined;
  return rest as ProjectPerimetroReferencia;
}

/** Prepara payload de empreendimento (`projects`) para addDoc/updateDoc. */
export function prepareProjectPayloadForFirestore<T extends Record<string, unknown>>(
  payload: T,
): T {
  const cleaned = stripUndefinedDeep(payload) as T & {
    perimetroReferencia?: ProjectPerimetroReferencia;
  };
  if (!cleaned.perimetroReferencia) return cleaned as T;
  return {
    ...cleaned,
    perimetroReferencia: perimetroReferenciaForFirestore(cleaned.perimetroReferencia),
  } as T;
}

const FIRESTORE_ERROR_MESSAGES_PT: Record<string, string> = {
  'permission-denied':
    'Sem permissão para esta operação. Verifique seu perfil ou peça ao administrador para publicar as regras do Firestore.',
  unavailable:
    'Serviço temporariamente indisponível. Verifique sua conexão e tente novamente.',
  'failed-precondition':
    'Operação não permitida no estado atual dos dados. Atualize a página e tente de novo.',
  'invalid-argument':
    'Dados inválidos para gravação. Revise os campos obrigatórios e formatos.',
  'already-exists': 'Este registro já existe.',
  'not-found': 'Registro não encontrado. Ele pode ter sido removido.',
  aborted: 'Operação cancelada. Tente novamente.',
  'resource-exhausted': 'Limite de uso atingido. Aguarde alguns minutos e tente novamente.',
  unauthenticated: 'Sessão expirada. Faça login novamente.',
  cancelled: 'Operação cancelada.',
  'deadline-exceeded': 'Tempo esgotado. Verifique sua conexão e tente novamente.',
};

export function getFirestoreErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code?: string }).code ?? '');
  }
  return '';
}

export function getFirestoreErrorMessage(error: unknown, code?: string): string {
  const resolvedCode = code ?? getFirestoreErrorCode(error);
  if (resolvedCode && FIRESTORE_ERROR_MESSAGES_PT[resolvedCode]) {
    return FIRESTORE_ERROR_MESSAGES_PT[resolvedCode];
  }
  if (error instanceof Error && error.message) {
    const msg = error.message;
    if (msg.includes('Missing or insufficient permissions')) {
      return FIRESTORE_ERROR_MESSAGES_PT['permission-denied'];
    }
    if (msg.includes('Nested arrays are not supported')) {
      return 'Não foi possível gravar geometria aninhada no banco. O perímetro será salvo apenas como arquivo; tente salvar novamente.';
    }
    return msg;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message ?? 'Erro desconhecido');
  }
  return 'Erro desconhecido ao comunicar com o banco de dados.';
}
