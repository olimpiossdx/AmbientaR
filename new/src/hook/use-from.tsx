// hook/use-form.tsx
import React from "react";
import { type IUseFormProps, type FormFieldElement, type FormSubmitResult } from "./use-form.type";
import { getProperty } from "../utils/object";
import { setCheckableElement, setRadioElement, setTextLikeElement, setSelectElement } from "../utils/element-setters";
import { isDefined, isFormField } from "../utils/type-checks";
import type { Path, PathValue } from "../utils/path";
import { useCheckboxMaster } from "./use-checkbox";
import { useValidation } from "./use-validation";
import type { ValidationConfig } from "./use-validation.type";
import { hasMaskApi, readFormModel, type ReadFormModelOptions } from "../utils/form-readers";

interface IUseFormWithValidationProps<T = Record<string, unknown>, TResult = void> extends IUseFormProps<T, TResult> {
  validation?: ValidationConfig<T>;
}

type FormValidationApi = {
  isValidating: boolean;
  validate: () => Promise<boolean>;
  validateField: (fieldName: string) => Promise<boolean>;
  validateScope: (scope: string) => Promise<boolean>;
  clearErrors: () => void;
};

type UseFormCoreProps<T, TResult = void> = IUseFormProps<T, TResult> & {
  formRef: React.RefObject<HTMLFormElement | null>;
  validationApi: FormValidationApi;
  hasValidation: boolean;
};


type GetDataOptions = ReadFormModelOptions;

function isApiResponseLike(value: unknown): value is { ok: boolean } {
  return Boolean(value && typeof value === "object" && "ok" in value && typeof (value as { ok?: unknown }).ok === "boolean");
}

function isSuccessfulSubmitResult(result: FormSubmitResult<unknown>): boolean {
  return !isApiResponseLike(result) || result.ok === true;
}

function useFormCore<T = Record<string, unknown>, TResult = void>({ model, id, onSubmit, formRef, validationApi, hasValidation }: UseFormCoreProps<T, TResult>) {
  const modelRef = React.useRef<Partial<T> | undefined>(model);
  const baselineModelRef = React.useRef<Partial<T> | undefined>(model);
  const hasCommittedBaselineRef = React.useRef(false);
  const onSubmitRef = React.useRef(onSubmit);

  const checkboxMaster = useCheckboxMaster({ formRef });

  const { isValidating, validate, validateField, validateScope, clearErrors } = validationApi;

  React.useLayoutEffect(() => {
    modelRef.current = model;

    if (!hasCommittedBaselineRef.current) {
      baselineModelRef.current = model;
    }

    onSubmitRef.current = onSubmit;
  }, [model, onSubmit]);

  const getData = React.useCallback((form: HTMLFormElement, externalFormData?: FormData, options?: GetDataOptions): T => {
    return readFormModel<T>(form, externalFormData, options);
  }, []);

  const handleSubmitRef = React.useRef<(submitEvent: Event) => Promise<void>>(async () => { });

  const handleSubmitLogic = React.useCallback(async (submitEvent: Event) => {
    submitEvent.preventDefault();

    if (isValidating) {
      console.warn("[useForm] Submit bloqueado: validação assíncrona em andamento.");
      return;
    }

    if (hasValidation) {
      const isValid = await validate();
      if (!isValid) {
        return;
      }
    }

    const form = submitEvent.target as HTMLFormElement;
    const sharedFormData = new FormData(form);
    const data = getData(form, sharedFormData);
    const nextBaseline = getData(form, sharedFormData, { unmask: false });

    try {
      const submitResult = await onSubmitRef.current(data, submitEvent as unknown as React.SubmitEvent<HTMLFormElement>);

      if (!isSuccessfulSubmitResult(submitResult)) {
        return;
      }

      baselineModelRef.current = nextBaseline;
      modelRef.current = nextBaseline;
      hasCommittedBaselineRef.current = true;
    } catch (error) {
      console.error(error);
    }
  }, [getData, hasValidation, isValidating, validate]);

  React.useEffect(() => {
    handleSubmitRef.current = handleSubmitLogic;
  }, [handleSubmitLogic]);

  const stableSubmitHandler = React.useCallback((e: Event) => {
    handleSubmitRef.current(e);
  }, []);

  const setElementValue = React.useCallback((element: FormFieldElement, value: unknown): void => {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case "checkbox":
          return setCheckableElement(element, value);
        case "radio":
          return setRadioElement(element, value);
        default:
          return setTextLikeElement(element, hasMaskApi(element) ? element.mask!.apply(value) : value);
      }
    }

    if (element instanceof HTMLSelectElement) {
      setSelectElement(element, value);
      return;
    }

    if (element instanceof HTMLTextAreaElement) {
      setTextLikeElement(element, hasMaskApi(element) ? element.mask!.apply(value) : value);
    }
  }, []);

  const dispatchFieldSyncEvent = React.useCallback((target: EventTarget | null, ...args: [value?: unknown]) => {
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const eventInit: CustomEventInit<{ value?: unknown }> = { bubbles: true };

    if (args.length > 0) {
      eventInit.detail = { value: args[0] };
    }

    target.dispatchEvent(new CustomEvent("useform:field-sync", eventInit));
  }, []);

  const setFieldValue = React.useCallback((form: HTMLFormElement, name: string, value: unknown): void => {
    const element = form.elements.namedItem(name);

    if (!isDefined(element)) {
      return;
    }

    if (element instanceof RadioNodeList) {
      const firstElement = element[0] as HTMLInputElement | undefined;

      if (firstElement && firstElement.type === "checkbox") {
        const values = Array.isArray(value)
          ? (value as string[])
          : typeof value === "string"
            ? [value]
            : [];

        const valueSet = new Set(values.map(String));

        Array.from(element).forEach((el) => {
          if (el instanceof HTMLInputElement && el.type === "checkbox") {
            const checked = valueSet.has(el.value);
            el.checked = checked;
            el.defaultChecked = checked;
            dispatchFieldSyncEvent(el, value);
          }
        });

        return;
      }

      Array.from(element).forEach((el) => {
        if (isFormField(el)) {
          setElementValue(el, value);
          dispatchFieldSyncEvent(el, value);
        }
      });

      return;
    }

    if (element instanceof HTMLSelectElement && element.multiple) {
      const values = Array.isArray(value)
        ? (value as string[]).map(String)
        : typeof value === "string"
          ? [value]
          : [];

      const valueSet = new Set(values);

      Array.from(element.options).forEach((option) => {
        const shouldSelect = valueSet.has(option.value);
        option.selected = shouldSelect;
        option.defaultSelected = shouldSelect;
      });

      dispatchFieldSyncEvent(element, values);
      return;
    }

    if (isFormField(element)) {
      setElementValue(element, value);
      dispatchFieldSyncEvent(element, value);
    }
  }, [dispatchFieldSyncEvent, setElementValue]);

  const setResolvedFieldValue = React.useCallback(
    (element: FormFieldElement, value: unknown): void => {
      if (element instanceof HTMLSelectElement && element.multiple) {
        const values = Array.isArray(value)
          ? value.map(String)
          : typeof value === "string"
            ? [value]
            : [];

        const valueSet = new Set(values);

        Array.from(element.options).forEach((option) => {
          const shouldSelect = valueSet.has(option.value);
          option.selected = shouldSelect;
          option.defaultSelected = shouldSelect;
        });

        dispatchFieldSyncEvent(element, values);
        return;
      }

      setElementValue(element, value);
      dispatchFieldSyncEvent(element, value);
    },
    [dispatchFieldSyncEvent, setElementValue],
  );

  const getValueFromModel = React.useCallback((modelData: unknown, path: string): unknown => {
    const keys = path.split(".");
    let current: unknown = modelData;

    for (const key of keys) {
      current = getProperty(current, key);

      if (!isDefined(current)) {
        return undefined;
      }
    }

    return current;
  }, []);

  const loadModel = React.useCallback((form: HTMLFormElement, modelData: Record<string, unknown>): number => {
    const elementsByName = new Map<string, FormFieldElement[]>();

    Array.from(form.elements).forEach((element) => {
      if (!isFormField(element) || !element.name) {
        return;
      }

      const current = elementsByName.get(element.name) ?? [];
      current.push(element);
      elementsByName.set(element.name, current);
    });

    elementsByName.forEach((fieldElements, name) => {
      const value = getValueFromModel(modelData, name);

      if (!isDefined(value)) {
        return;
      }

      if (fieldElements.length > 1) {
        setFieldValue(form, name, value);
        return;
      }

      setResolvedFieldValue(fieldElements[0], value);
    });

    const frameId = requestAnimationFrame(() => { checkboxMaster.refresh(form); });

    return frameId;
  }, [checkboxMaster, getValueFromModel, setFieldValue, setResolvedFieldValue, dispatchFieldSyncEvent]);

  const setupMutationObserver = React.useCallback((form: HTMLFormElement) => {
    let frameId: number | null = null;
    const pendingNodes = new Set<HTMLElement>();

    const processPendingNodes = () => {
      const hasPendingAddedNodes = pendingNodes.size > 0;

      if (!hasPendingAddedNodes) {
        return;
      }

      if (hasPendingAddedNodes) {
        const elementsToProcess = new Set<FormFieldElement>();

        pendingNodes.forEach((node) => {
          if (isFormField(node as Element)) {
            elementsToProcess.add(node as FormFieldElement);
          }

          const nestedElements = node.querySelectorAll<FormFieldElement>("input[name], select[name], textarea[name]");

          nestedElements.forEach((el) => elementsToProcess.add(el));
        });

        elementsToProcess.forEach((element) => {
          const name = element.getAttribute("name");

          if (!isDefined(name)) {
            return;
          }

          const modelValue = getValueFromModel(modelRef.current, name);

          if (isDefined(modelValue)) {
            setResolvedFieldValue(element, modelValue);
          }
        });
      }

      pendingNodes.clear();
      frameId = null;
    };

    const observer = new MutationObserver((mutations) => {
      let hasRelevantAdditions = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          let isDescendantOfPending = false;

          for (const pending of pendingNodes) {
            if (pending.contains(node)) {
              isDescendantOfPending = true;
              break;
            }
          }

          if (isDescendantOfPending) {
            return;
          }

          pendingNodes.forEach((pending) => {
            if (node.contains(pending)) {
              pendingNodes.delete(pending);
            }
          });

          pendingNodes.add(node);
          hasRelevantAdditions = true;
        });
      });

      if (hasRelevantAdditions && frameId === null) {
        frameId = requestAnimationFrame(processPendingNodes);
      }
    });

    observer.observe(form, { childList: true, subtree: true });

    return {
      disconnect: () => {
        observer.disconnect();

        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }

        pendingNodes.clear();
      },
    };
  }, [getValueFromModel, setResolvedFieldValue]);

  React.useLayoutEffect(() => {
    const form = formRef.current ?? (document.getElementById(id) as HTMLFormElement | null);

    if (!form) {
      return;
    }

    formRef.current = form;

    const customObserver = setupMutationObserver(form);
    checkboxMaster.setup(form);
    form.addEventListener("submit", stableSubmitHandler);

    let frameId: number | null = null;

    if (modelRef.current) {
      frameId = loadModel(form, modelRef.current as Record<string, unknown>);
    }

    return () => {
      form.removeEventListener("submit", stableSubmitHandler);
      customObserver.disconnect();
      checkboxMaster.cleanup();

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      formRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submit = React.useCallback(() => {
    formRef.current?.requestSubmit();
  }, [formRef]);

  const reset = React.useCallback(() => {
    const form = formRef.current ?? (document.getElementById(id) as HTMLFormElement | null);

    if (!form) {
      return;
    }

    form.reset();

    requestAnimationFrame(() => {
      if (baselineModelRef.current) {
        loadModel(form, baselineModelRef.current as Record<string, unknown>);
      }

      checkboxMaster.onReset();
      clearErrors();

      Array.from(form.elements).forEach((element) => {
        dispatchFieldSyncEvent(element);
      });
    });
  }, [
    id,
    loadModel,
    checkboxMaster,
    clearErrors,
    dispatchFieldSyncEvent,
  ]);

  const isFieldInsideScope = React.useCallback((fieldName: string, scope: string): boolean => {
    return fieldName === scope || fieldName.startsWith(`${scope}.`) || fieldName.startsWith(`${scope}[`);
  }, []);

  const clearFieldValue = React.useCallback((form: HTMLFormElement, name: string): void => {
    const element = form.elements.namedItem(name);

    if (!isDefined(element)) {
      return;
    }

    if (element instanceof RadioNodeList) {
      Array.from(element).forEach((el) => {
        if (el instanceof HTMLInputElement) {
          if (el.type === "checkbox" || el.type === "radio") {
            el.checked = false;
            el.defaultChecked = false;
            dispatchFieldSyncEvent(el, undefined);
            return;
          }
        }

        if (isFormField(el)) {
          setResolvedFieldValue(el, "");
        }
      });

      return;
    }

    if (element instanceof HTMLSelectElement && element.multiple) {
      Array.from(element.options).forEach((option) => {
        option.selected = false;
        option.defaultSelected = false;
      });
      dispatchFieldSyncEvent(element, []);
      return;
    }

    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      element.checked = false;
      element.defaultChecked = false;
      dispatchFieldSyncEvent(element, undefined);
      return;
    }

    if (isFormField(element)) {
      setResolvedFieldValue(element, "");
    }
  }, [dispatchFieldSyncEvent, setResolvedFieldValue]);

  const resetField = React.useCallback((path: string): void => {
    const form = formRef.current ?? (document.getElementById(id) as HTMLFormElement | null);

    if (!form) {
      return;
    }

    const value = getValueFromModel(baselineModelRef.current, path);

    if (isDefined(value)) {
      setFieldValue(form, path, value);
    } else {
      clearFieldValue(form, path);
    }

    checkboxMaster.refresh(form);
  }, [formRef, id, getValueFromModel, setFieldValue, clearFieldValue, checkboxMaster]);

  const resetSection = React.useCallback((path: string): void => {
    const form = formRef.current ?? (document.getElementById(id) as HTMLFormElement | null);

    if (!form) {
      return;
    }

    const fieldNames = new Set<string>();

    Array.from(form.elements).forEach((element) => {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) {
        return;
      }

      if (!element.name || !isFieldInsideScope(element.name, path)) {
        return;
      }

      fieldNames.add(element.name);
    });

    fieldNames.forEach((fieldName) => {
      const value = getValueFromModel(baselineModelRef.current, fieldName);

      if (isDefined(value)) {
        setFieldValue(form, fieldName, value);
      } else {
        clearFieldValue(form, fieldName);
      }
    });

    checkboxMaster.refresh(form);
  }, [formRef, id, isFieldInsideScope, getValueFromModel, setFieldValue, clearFieldValue, checkboxMaster]);

  const commit = React.useCallback((nextModel?: Partial<T>) => {
    const form = formRef.current ?? (document.getElementById(id) as HTMLFormElement | null);

    if (!form && !isDefined(nextModel)) {
      return;
    }

    const nextBaseline = isDefined(nextModel)
      ? nextModel
      : getData(form as HTMLFormElement, undefined, { unmask: false });

    baselineModelRef.current = nextBaseline;
    modelRef.current = nextBaseline;
    hasCommittedBaselineRef.current = true;

    if (form) {
      loadModel(form, nextBaseline as Record<string, unknown>);
    }
  }, [formRef, id, getData, loadModel]);

  const getModel = React.useCallback((): T | null => {
    if (!isDefined(formRef.current)) {
      return null;
    }
    return getData(formRef.current);
  }, [formRef, getData]);

  const setFieldValueExposed = React.useCallback((path: string, value: unknown) => {

    if (!isDefined(formRef.current)) {
      return;
    }

    setFieldValue(formRef.current, path, value);
  }, [formRef, setFieldValue]);

  const getFieldValue = React.useCallback(<P extends Path<T>>(path: P): PathValue<T, P> | null => {
    if (!isDefined(formRef.current)) {
      return null;
    }

    const data = getData(formRef.current);
    return getValueFromModel(data, path) as PathValue<T, P>;
  }, [formRef, getData, getValueFromModel]);

  return {
    formProps: { id, ref: formRef },
    formRef,
    submit,
    reset,
    resetField,
    resetSection,
    commit,
    getModel,
    setFieldValue: setFieldValueExposed,
    getFieldValue,
    isValidating,
    validate,
    validateField,
    validateScope,
    clearErrors,
  };
}

function useFormWithValidation<T = Record<string, unknown>, TResult = void>(props: IUseFormWithValidationProps<T, TResult> & { validation: ValidationConfig<T>; }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const validationApi = useValidation<T>(formRef, props.validation);

  return useFormCore<T, TResult>({ ...props, formRef, validationApi, hasValidation: true });
}

function useFormWithoutValidation<T = Record<string, unknown>, TResult = void>(props: IUseFormProps<T, TResult>) {
  const formRef = React.useRef<HTMLFormElement>(null);

  const validationApi = React.useMemo<FormValidationApi>(() => ({
    isValidating: false,
    validate: async () => true,
    validateField: async () => true,
    validateScope: async () => true,
    clearErrors: () => { },
  }), []);

  return useFormCore<T, TResult>({ ...props, formRef, validationApi, hasValidation: false });
}

export function useForm<T = Record<string, unknown>, TResult = void>(props: IUseFormWithValidationProps<T, TResult>) {
  if (isDefined(props.validation)) {
    return useFormWithValidation<T, TResult>(props as IUseFormWithValidationProps<T, TResult> & { validation: ValidationConfig<T>; });
  }

  return useFormWithoutValidation<T, TResult>(props);
}
