// utils/element-setters.ts
/**
 * Coleção de funções para aplicar valores a elementos de formulário nativos,
 * alterando tanto o valor atual quanto o valor padrão (default).
 *
 * Cada função trata um tipo específico de elemento, garantindo que
 * o estado do formulário seja consistente após carregamento de modelo
 * e após operações de reset.
 */

import { toStringOrEmpty } from "./type-checks";

/**
 * Define o valor de um input textual ou textarea.
 * Tanto `value` quanto `defaultValue` são atualizados para
 * que o reset do formulário funcione corretamente.
 *
 * @param element - Input (com tipo textual) ou Textarea.
 * @param value - Valor a ser atribuído.
 */
export function setTextLikeElement( element: HTMLInputElement | HTMLTextAreaElement, value: unknown ): void {
  const str = toStringOrEmpty(value);
  element.value = str;
  element.defaultValue = str;
}

/**
 * Define o estado de um checkbox.
 * Atualiza tanto `checked` quanto `defaultChecked`.
 *
 * @param element - Input do tipo checkbox.
 * @param value - Valor convertido para booleano (truthy/falsy).
 */
export function setCheckableElement( element: HTMLInputElement, value: unknown): void {
  const checked = Boolean(value);
  element.checked = checked;
  element.defaultChecked = checked;
}

/**
 * Define a seleção de um radio button.
 * Apenas o radio button cujo `value` coincide com o valor
 * fornecido é marcado; os demais permanecem inalterados.
 *
 * @param element - Input do tipo radio.
 * @param value - Valor a ser comparado com `element.value`.
 */
export function setRadioElement( element: HTMLInputElement, value: unknown ): void {
  const str = toStringOrEmpty(value);
  const checked = element.value === str;
  element.checked = checked;
  element.defaultChecked = checked;
}

/**
 * Define a opção selecionada de um elemento `<select>`.
 * Atualiza `value` no select e também a propriedade
 * `defaultSelected` da `<option>` correspondente.
 *
 * @param element - Elemento select.
 * @param value - Valor a ser selecionado.
 */
export function setSelectElement(element: HTMLSelectElement, value: unknown): void {
  const str = toStringOrEmpty(value);
  const optionExists = Array.from(element.options).some(opt => opt.value === str);

  if (optionExists) {
    element.value = str;
    // Marca defaultSelected apenas na opção correta, limpando as outras
    Array.from(element.options).forEach(opt => {
      opt.defaultSelected = (opt.value === str);
    });
  } else {
    // Valor inválido: desmarca tudo (selectedIndex = -1) e limpa defaultSelected
    element.selectedIndex = -1;
    Array.from(element.options).forEach(opt => {
      opt.defaultSelected = false;
    });
  }
}