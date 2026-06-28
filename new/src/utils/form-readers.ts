import type { FormFieldElement, ModelValue, NestedObject } from "../hook/use-form.type";
import type { InputMaskApi } from "./mask-builder";
import { parseFormData, setNestedValue } from "./path-parse";
import { isFormField } from "./type-checks";

type UnmaskStrategy = "digits" | "number" | "currency" | "cpf" | "cnpj" | "phone" | "telefone" | "tel";

type MaskedFormFieldElement = FormFieldElement & {
  mask?: InputMaskApi;
};

export type ReadFormModelOptions = {
  /**
   * Quando false, preserva o valor visual dos campos no DOM.
   * Usado para baseline/commit/reset.
   *
   * Quando true, aplica Input.mask/data-unmask no modelo retornado.
   * Usado para submit/getModel/getFieldValue/validacao.
   *
   * @default true
   */
  unmask?: boolean;
};

export function hasMaskApi(element: FormFieldElement): element is MaskedFormFieldElement {
  const maskApi = (element as MaskedFormFieldElement).mask;

  return Boolean(maskApi && typeof maskApi.apply === "function" && typeof maskApi.remove === "function");
}

function getElementUnmaskStrategy(element: Element): string | null {
  return element.getAttribute("data-unmask");
}

export function unmaskValue(value: unknown, strategy: string | null): unknown {
  if (!strategy || typeof value !== "string") {
    return value;
  }

  const normalizedStrategy = strategy.toLowerCase() as UnmaskStrategy;

  if (["digits", "cpf", "cnpj", "phone", "telefone", "tel"].includes(normalizedStrategy)) {
    return value.replace(/\D/g, "");
  }

  if (normalizedStrategy === "currency") {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    return String(Number(digits) / 100);
  }

  if (normalizedStrategy === "number") {
    const normalized = value
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");

    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return "";
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}

export function readFormFieldValue(element: FormFieldElement, options?: ReadFormModelOptions): unknown {
  const shouldUnmask = options?.unmask !== false;

  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    const hasValue = element.hasAttribute("value") && element.value !== "on";

    if (!element.checked) {
      return false;
    }

    if (!hasValue) {
      return true;
    }

    if (hasMaskApi(element)) {
      return shouldUnmask ? element.mask!.remove(element.value) : element.value;
    }

    return unmaskValue(element.value, shouldUnmask ? getElementUnmaskStrategy(element) : null);
  }

  if (element instanceof HTMLSelectElement && element.multiple) {
    const strategy = shouldUnmask ? getElementUnmaskStrategy(element) : null;

    return Array.from(element.selectedOptions).map((option) =>
      unmaskValue(option.value, strategy),
    );
  }

  if (hasMaskApi(element)) {
    return shouldUnmask ? element.mask!.remove(element.value) : element.value;
  }

  return unmaskValue(element.value, shouldUnmask ? getElementUnmaskStrategy(element) : null);
}

export function readFormModel<T = Record<string, unknown>>(
  form: HTMLFormElement,
  externalFormData?: FormData,
  options?: ReadFormModelOptions,
): T {
  const shouldUnmask = options?.unmask !== false;
  const formData = externalFormData ?? new FormData(form);
  const data = parseFormData<Record<string, unknown>>(formData);
  const fieldsByName = new Map<string, FormFieldElement[]>();

  Array.from(form.elements).forEach((element) => {
    if (!isFormField(element) || !element.name) {
      return;
    }

    const fields = fieldsByName.get(element.name) ?? [];
    fields.push(element);
    fieldsByName.set(element.name, fields);
  });

  fieldsByName.forEach((fields, name) => {
    const firstField = fields[0];

    if (firstField instanceof HTMLSelectElement && firstField.multiple) {
      setNestedValue(data as NestedObject, name, readFormFieldValue(firstField, { unmask: shouldUnmask }) as ModelValue);
      return;
    }

    const checkboxFields = fields.filter(
      (field): field is HTMLInputElement => field instanceof HTMLInputElement && field.type === "checkbox",
    );

    if (checkboxFields.length > 1) {
      const strategy = shouldUnmask ? getElementUnmaskStrategy(checkboxFields[0]) : null;
      const values = checkboxFields
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => {
          if (hasMaskApi(checkbox)) {
            return shouldUnmask ? checkbox.mask!.remove(checkbox.value) : checkbox.value;
          }

          return unmaskValue(checkbox.value, strategy);
        });

      setNestedValue(data as NestedObject, name, values as ModelValue);
      return;
    }

    fields.forEach((field) => {
      const hasUnmask = field.hasAttribute("data-unmask");
      const hasMask = hasMaskApi(field);

      if (!hasUnmask && !hasMask) {
        return;
      }

      if (field instanceof HTMLInputElement) {
        if (field.type === "file") {
          return;
        }

        if (field.type === "radio" && !field.checked) {
          return;
        }
      }

      if (field instanceof HTMLSelectElement && field.multiple) {
        return;
      }

      setNestedValue(data as NestedObject, name, readFormFieldValue(field, { unmask: shouldUnmask }) as ModelValue);
    });
  });

  return data as T;
}
