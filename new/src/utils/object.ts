// utils/object.ts
/**
 * Utilitário para acesso seguro a propriedades de objetos ou arrays,
 * incluindo navegação por caminhos com índices numéricos.
 */

/**
 * Obtém o valor de uma propriedade de um objeto ou de um índice de um array.
 *
 * @param obj - O valor de origem (pode ser objeto, array, null, undefined).
 * @param key - A chave (string) da propriedade ou o índice no caso de array.
 * @returns O valor correspondente, ou `undefined` se não for possível acessar.
 */
export function getProperty(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") {
    return undefined;
  }
  if (Array.isArray(obj)) {
    const index = Number(key);
    return Number.isNaN(index) ? undefined : obj[index];
  }
  return (obj as Record<string, unknown>)[key];
}


/**
 * Atualiza o estado visual do checkbox mestre com base nos checkboxes controlados.
 *
 * @param master - O checkbox mestre a ser atualizado.
 * @param checkboxes - Conjunto de checkboxes controlados pelo mestre.
 */
export function atualizarMestre(master: HTMLInputElement, checkboxes: Set<HTMLInputElement>): void {
  const total = checkboxes.size;

  // Se não há checkboxes controlados, desmarca e remove estado indeterminado
  if (total === 0) {
    master.checked = false;
    master.indeterminate = false;
    return;
  }

  // Conta quantos checkboxes estão marcados
  let marcados = 0;
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      marcados++;
    }
  });

  // Define o estado visual do mestre
  master.checked = marcados === total;
  master.indeterminate = marcados > 0 && marcados < total;
}


export function createInstanceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `managed-action-${Math.random().toString(36).slice(2)}`;
}
