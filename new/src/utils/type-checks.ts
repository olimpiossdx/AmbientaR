// utils/type-checks.ts
/**
 * Funções utilitárias para verificações de tipo e conversões,
 * amplamente utilizadas pelo hook `useForm` e seus auxiliares.
 */

import type { FormFieldElement } from "../hook/use-form.type";

/**
 * Verifica se um valor é um objeto plano (não array, não null).
 *
 * @param value - Valor a ser verificado.
 * @returns `true` se for um objeto plano.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null 
    && typeof value === 'object' 
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Verifica se uma string consiste apenas de dígitos numéricos.
 *
 * @param value - String a ser testada.
 * @returns `true` se a string for numérica (ex.: "0", "123").
 */
export function isNumberString(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Converte um valor para string, retornando string vazia
 * quando o valor for `null` ou `undefined`.
 *
 * @param value - Valor a ser convertido.
 * @returns String representando o valor.
 */
export function toStringOrEmpty(value: unknown): string {
  return value != null ? String(value) : "";
}

/**
 * Verifica se o valor não é `null` nem `undefined`.
 * Atua como **type guard**, refinando o tipo no escopo.
 *
 * @template T - Tipo esperado do valor.
 * @param value - Valor a ser verificado.
 * @returns `true` se o valor for definido.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Verifica se um elemento do DOM é um elemento de formulário suportado
 * (input, select ou textarea).
 *
 * @param element - Elemento DOM.
 * @returns `true` se for um elemento de formulário reconhecido.
 */
export function isFormField(  element: Element | null): element is FormFieldElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

/**
 * Verifica se um valor é considerado "com valor" para campos de formulário:
 * - Não é `null`/`undefined`
 * - Se string, não é `""`
 * - Se array, não é `[]`
 * - Outros tipos (números, booleanos, File, objetos) são considerados com valor.
 *
 * @param value - Valor a ser avaliado.
 * @returns `true` se o campo pode ser considerado preenchido.
 */
export function hasValue(value: unknown): boolean {
  if (!isDefined(value)) {
    return false;
  } else if (typeof value === 'string') {
    return value.length > 0;
  } else if (Array.isArray(value)) {
    return value.length > 0;
  }
  // Objetos e outros tipos são considerados com valor.
  return true;
}