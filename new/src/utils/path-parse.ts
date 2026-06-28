// utils/path-parse.ts
/**
 * Funções para análise e construção de objetos aninhados a partir
 * de pares `name`/`value` do `FormData`, utilizando uma notação
 * de caminho baseada em pontos e índices numéricos.
 *
 * Exemplos de caminhos:
 * - "cliente.nome" → objeto.cliente.nome
 * - "itens.0.produtoId" → array[0].produtoId
 * - "categorias" (chave repetida) → array de primitivos
 *
 * Também é responsável por normalizar caminhos com colchetes
 * (ex.: "itens[0].nome" → "itens.0.nome").
 */

import type { ModelValue } from "../hook/use-form.type";
import { isPlainObject, isNumberString } from "./type-checks";

type NestedObject = Record<string, ModelValue>;

/**
 * Converte um caminho com possível notação de colchetes
 * para uma lista de segmentos separados por ponto.
 *
 * @example
 * parsePath("itens[0].nome")   // ["itens", "0", "nome"]
 * parsePath("cliente.nome")    // ["cliente", "nome"]
 *
 * @param path - Caminho original (ex.: "itens[0].nome").
 * @returns Array de strings com cada segmento do caminho.
 */
export function parsePath(path: string): string[] {
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");
  return normalized.split(".").filter(Boolean);
}

/**
 * Insere um valor em um objeto aninhado, criando objetos e arrays
 * intermediários conforme necessário.
 *
 * @param obj - Objeto raiz onde o valor será inserido.
 * @param path - Caminho no formato separado por pontos (ex.: "itens.0.nome").
 * @param value - Valor a ser atribuído.
 * @param isArrayPrimitive - Se `true`, trata o caminho como um array primitivo (mesmo nome repetido).
 */
/**
 * Objeto reutilizado como protótipo para novos objetos intermediários.
 * Evita alocação de `{}` vazio a cada nível do caminho.
 */
const OBJECT_PROTO = Object.prototype;

export function setNestedValue(obj: NestedObject,  path: string,  value: ModelValue,  isArrayPrimitive: boolean = false): void {
  // Array primitivo (ex.: várias tags com name="tags" sem índice)
  if (isArrayPrimitive) {
    const existing = obj[path];
    if (!Array.isArray(existing)) {
      (obj as Record<string, ModelValue>)[path] = [];
    }
    ((obj as Record<string, ModelValue>)[path] as ModelValue[]).push(value);
    return;
  }

  const keys = parsePath(path);
  let current: ModelValue = obj;

  // Navega até o penúltimo segmento, criando estrutura conforme necessário
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextIndex = isNumberString(nextKey);

    if (isNextIndex) {
      const arrCandidate: ModelValue = (current as Record<string, ModelValue>)[key];
      let arr: ModelValue[];
      if (Array.isArray(arrCandidate)) {
        arr = arrCandidate;
      } else {
        arr = [];
        (current as Record<string, ModelValue>)[key] = arr;
      }
      const index = parseInt(nextKey, 10);

      // Se o índice for o último segmento, atribui diretamente e encerra
      if (i + 1 === keys.length - 1) {
        arr[index] = value;
        return;
      }

      // Caso contrário, cria objeto intermediário no índice
      if (!arr[index]) {
        arr[index] = Object.create(OBJECT_PROTO) as ModelValue;
      }
      current = arr[index];
      i++; // pula o índice numérico
    } else {
      const nextCandidate: ModelValue = (current as Record<string, ModelValue>)[key];
      let next: ModelValue;
      if (isPlainObject(nextCandidate)) {
        next = nextCandidate;
      } else {
        // Usa Object.create em vez de {} para reutilizar o protótipo
        next = Object.create(OBJECT_PROTO) as ModelValue;
        (current as Record<string, ModelValue>)[key] = next;
      }
      current = next;
    }
  }

  const lastKey = keys[keys.length - 1];
  if (isNumberString(lastKey)) {
    const index = parseInt(lastKey, 10);
    if (Array.isArray(current)) {
      current[index] = value;
    }
  } else {
    (current as Record<string, ModelValue>)[lastKey] = value;
  }
}

/**
 * Transforma um objeto `FormData` em um objeto tipado (`T`),
 * interpretando caminhos e agrupando campos repetidos
 * (ex.: checkboxes de mesmo nome ou arrays indexados).
 *
 * @template T - Tipo esperado do resultado.
 * @param formData - Dados do formulário.
 * @returns Objeto com a estrutura aninhada correspondente.
 */
export function parseFormData<T = NestedObject>(formData: FormData): T {
  const result: NestedObject = {};

  // Identifica campos com mesmo nome (possíveis arrays de primitivos)
  // Usa Map nativo para melhor performance com muitos campos
  const fieldCounts = new Map<string, number>();
  formData.forEach((_, key) => {
    fieldCounts.set(key, (fieldCounts.get(key) || 0) + 1);
  });

  // Segunda passagem: constrói o objeto aninhado
  formData.forEach((value, key) => {
    const count = fieldCounts.get(key) || 1;
    const isArrayPrimitive =
      count > 1 && !key.includes(".") && !key.includes("[");
    setNestedValue(result, key, value as ModelValue, isArrayPrimitive);
  });

  return result as T;
}