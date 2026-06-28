import React from "react";

import type { FormFieldElement } from "./use-form.type";
import type {
  CustomValidationRule,
  FieldValidationState,
  NormalizedValidationResult,
  UseValidationReturn,
  ValidateScopeTarget,
  ValidationConfig,
  ValidationFeedbackMode,
  ValidationResult,
  ValidationResultType,
  ValidationState,
} from "./use-validation.type";
import { isDefined, isFormField } from "../utils/type-checks";
import { readFormFieldValue, readFormModel } from "../utils/form-readers";

const VALID_SCHEMA_PATH_REGEX =
  /^[a-zA-Z_$][\w$]*(\.(\*|\d+|[a-zA-Z_$][\w$]*))*$/;
export const FORM_VALIDATION_STATE_CHANGE_EVENT =
  "form-validation:state-change";

function assertValidSchemaPath(schemaPath: string): void {
  if (!VALID_SCHEMA_PATH_REGEX.test(schemaPath)) {
    throw new Error(
      `Invalid validation schema path: "${schemaPath}". Use only dot notation paths like "cliente.nome" or "itens.*.valor".`,
    );
  }
}

function wildcardPathToRegExp(schemaPath: string): RegExp {
  assertValidSchemaPath(schemaPath);

  const pattern = schemaPath
    .split(".")
    .map((part) => (part === "*" ? "\\d+" : part))
    .join("\\.");

  return new RegExp(`^${pattern}$`);
}

function normalizeRules<T>(
  rules: CustomValidationRule<T> | CustomValidationRule<T>[],
): CustomValidationRule<T>[] {
  return Array.isArray(rules) ? rules : [rules];
}

function readFieldValue(element: FormFieldElement): unknown {
  return readFormFieldValue(element);
}

function createDebounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Args): void => {
    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  const cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { debounced, cancel };
}

function extractArrayIndex(fieldName: string): string | undefined {
  const match = fieldName.match(/\.(\d+)\./);
  return match ? match[1] : undefined;
}

function resolveWildcardWithIndex(schemaPath: string, index: string): string {
  return schemaPath.replace("*", index);
}

function resultMessageToString(message: React.ReactNode): string {
  if (typeof message === "string") {
    return message;
  }

  if (typeof message === "number") {
    return String(message);
  }

  return "";
}

function isBlockingResult(result: NormalizedValidationResult): boolean {
  return !result.valid && result.type === "error";
}

function validationResultToStatus(
  result?: NormalizedValidationResult,
): FieldValidationState["status"] {
  if (!result) {
    return "valid";
  }

  if (isBlockingResult(result) || result.type === "error") {
    return "invalid";
  }

  return result.type;
}

function normalizeCustomResult(
  result: ValidationResult,
): NormalizedValidationResult {
  const type = result.type ?? (result.valid ? "neutral" : "error");

  return {
    valid: result.valid,
    message: result.message ?? "",
    type,
    source: "custom",
  };
}

function normalizeNativeResult(
  element: FormFieldElement,
): NormalizedValidationResult | null {
  element.setCustomValidity("");

  if (element.checkValidity()) {
    return null;
  }

  return {
    valid: false,
    message: element.validationMessage,
    type: "error",
    source: "native",
  };
}

function resolveFeedbackMode<T>(
  config: ValidationConfig<T>,
  rule?: CustomValidationRule<T>,
): ValidationFeedbackMode {
  return rule?.feedbackMode ?? config.feedbackMode ?? config.mode ?? "native";
}

interface IHelperTextApiLike {
  set: (message: React.ReactNode, status?: ValidationResultType) => void;
  clear: () => void;
}

type IFieldWithHelperText = FormFieldElement & {
  helperText?: IHelperTextApiLike;
};

function validationStateEquals(
  a: ValidationState,
  b: ValidationState,
): boolean {
  if (
    a.known !== b.known ||
    a.valid !== b.valid ||
    a.hasErrors !== b.hasErrors ||
    a.validating !== b.validating
  ) {
    return false;
  }

  const aKeys = Object.keys(a.fields);
  const bKeys = Object.keys(b.fields);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => {
    const left = a.fields[key];
    const right = b.fields[key];

    return (
      Boolean(right) &&
      left.valid === right.valid &&
      left.status === right.status &&
      left.blocking === right.blocking &&
      left.touched === right.touched &&
      left.dirty === right.dirty &&
      left.message === right.message &&
      left.source === right.source
    );
  });
}

function setFieldVisualState(element: FormFieldElement, result?: NormalizedValidationResult): void {
  const blocking = result ? isBlockingResult(result) : false;
  const status = result?.type;

  element.toggleAttribute("data-invalid", blocking);

  if (blocking) {
    element.setAttribute("aria-invalid", "true");
  } else {
    element.removeAttribute("aria-invalid");
  }

  if (status) {
    element.setAttribute("data-validation-status", status);
    return;
  }

  element.removeAttribute("data-validation-status");
}

function applyFieldFeedback(element: FormFieldElement, result: NormalizedValidationResult | undefined, feedbackMode: ValidationFeedbackMode,
  options?: { reportNative?: boolean; allowInvalidFocus?: boolean }): void {
  const blocking = result ? isBlockingResult(result) : false;
  const customValidityMessage = blocking && result ? resultMessageToString(result.message) : "";

  element.setCustomValidity(customValidityMessage);
  setFieldVisualState(element, result);

  const elementWithHelper = element as IFieldWithHelperText;
  if (feedbackMode === "helper" || feedbackMode === "both") {
    if (result?.message) {
      elementWithHelper.helperText?.set(result.message, result.type);
    } else {
      elementWithHelper.helperText?.clear();
    }
  }

  if (feedbackMode !== "helper" && feedbackMode !== "both") {
    elementWithHelper.helperText?.clear();
  }

  if ((feedbackMode === "native" || feedbackMode === "both") && options?.reportNative) {
    element.reportValidity();
  }

  if (options?.allowInvalidFocus && blocking) {
    window.requestAnimationFrame(() => {
      if (!element.isConnected) {
        return;
      }

      element.focus();
    });
  }
}

function clearFieldFeedback(element: FormFieldElement, feedbackMode: ValidationFeedbackMode): void {
  element.setCustomValidity("");
  element.removeAttribute("data-invalid");
  element.removeAttribute("aria-invalid");
  element.removeAttribute("data-validation-status");

  if (feedbackMode === "helper" || feedbackMode === "both") {
    (element as IFieldWithHelperText).helperText?.clear();
  }
}

function clearTypingFeedback(element: FormFieldElement, feedbackMode: ValidationFeedbackMode): void {
  clearFieldFeedback(element, feedbackMode);
}

interface SchemaIndexEntry<T> {
  schemaPath: string;
  rulesAll: CustomValidationRule<T>[];
  matchFieldName: (fieldName: string) => boolean;
}

interface DependentsCacheEntry {
  targetSchemaPath: string;
  matchDepPath: (fieldName: string) => boolean;
}

type ValidateFieldOptions<T> = {
  event?: Event;
  skipDependents?: boolean;
  externalModel?: T;
  reportNative?: boolean;
  allowInvalidFocus?: boolean;
  markKnown?: boolean;
};

export function useValidation<T = unknown>(
  formRef: React.RefObject<HTMLFormElement | null>,
  config: ValidationConfig<T>,
): UseValidationReturn<T> {
  const configRef = React.useRef(config);
  const isValidatingFieldsRef = React.useRef<Map<string, boolean>>(new Map());
  const validationAbortRef = React.useRef<Map<string, AbortController>>(
    new Map(),
  );
  const invalidBlurFocusAttemptedRef = React.useRef<Set<string>>(new Set());
  const fieldStatesRef = React.useRef<Record<string, FieldValidationState>>({});
  const validationKnownRef = React.useRef(false);

  const [isValidating, setIsValidating] = React.useState(false);
  const [validationState, setValidationState] = React.useState<ValidationState>(
    {
      known: false,
      valid: true,
      hasErrors: false,
      validating: false,
      fields: {},
    },
  );

  React.useLayoutEffect(() => {
    configRef.current = config;
  }, [config]);

  const schemaIndexRef = React.useRef<SchemaIndexEntry<T>[]>([]);
  const dependentsMapCacheRef = React.useRef<
    Map<string, DependentsCacheEntry[]>
  >(new Map());

  const buildValidationState = React.useCallback((): ValidationState => {
    const fields = { ...fieldStatesRef.current };
    const fieldValues = Object.values(fields);
    const form = formRef.current;
    const known = validationKnownRef.current;

    const expectedFieldNames =
      known && form
        ? Array.from(form.elements)
          .filter(
            (element): element is FormFieldElement =>
              isFormField(element) && isDefined(element.getAttribute("name")),
          )
          .map((element) => element.getAttribute("name"))
          .filter(isDefined)
          .filter((fieldName) =>
            schemaIndexRef.current.some(({ matchFieldName }) =>
              matchFieldName(fieldName),
            ),
          )
        : [];

    const hasUnknownFields = expectedFieldNames.some(
      (fieldName) => !fields[fieldName],
    );
    const hasBlockingErrors = fieldValues.some((field) => field.blocking);
    const hasErrors = known
      ? hasBlockingErrors || hasUnknownFields
      : hasBlockingErrors;
    const validating = isValidatingFieldsRef.current.size > 0;

    return {
      known,
      valid: !hasErrors,
      hasErrors,
      validating,
      fields,
    };
  }, [formRef]);

  const syncValidationState = React.useCallback(() => {
    const nextState = buildValidationState();

    setIsValidating((current) =>
      current === nextState.validating ? current : nextState.validating,
    );
    setValidationState((current) => {
      if (validationStateEquals(current, nextState)) {
        return current;
      }

      formRef.current?.dispatchEvent(
        new CustomEvent(FORM_VALIDATION_STATE_CHANGE_EVENT, {
          bubbles: true,
          detail: nextState,
        }),
      );

      return nextState;
    });
  }, [buildValidationState, formRef]);

  React.useLayoutEffect(() => {
    const { schema } = config;

    const newSchemaIndex: SchemaIndexEntry<T>[] = Object.entries(schema).map(
      ([schemaPath, rules]) => {
        const rulesAll = normalizeRules(
          rules as CustomValidationRule<T> | CustomValidationRule<T>[],
        );
        const hasWildcard = schemaPath.includes("*");
        const compiledRegExp = hasWildcard
          ? wildcardPathToRegExp(schemaPath)
          : null;

        return {
          schemaPath,
          rulesAll,
          matchFieldName: hasWildcard
            ? (fieldName: string) => compiledRegExp!.test(fieldName)
            : (fieldName: string) => fieldName === schemaPath,
        };
      },
    );

    const form = formRef.current;
    if (form) {
      Array.from(form.elements)
        .filter(
          (element): element is FormFieldElement =>
            isFormField(element) && isDefined(element.getAttribute("name")),
        )
        .forEach((element) => {
          const name = element.getAttribute("name")!;
          const stillInSchema = newSchemaIndex.some(({ matchFieldName }) =>
            matchFieldName(name),
          );

          if (!stillInSchema && element.validity.customError) {
            clearFieldFeedback(element, resolveFeedbackMode(config));
            delete fieldStatesRef.current[name];
          }
        });
    }

    schemaIndexRef.current = newSchemaIndex;

    const dependentsMapBuilt = new Map<string, DependentsCacheEntry[]>();
    newSchemaIndex.forEach(({ schemaPath, rulesAll }) => {
      rulesAll.forEach((rule) => {
        rule.dependsOn?.forEach((depPath) => {
          const hasWildcard = depPath.includes("*");
          const compiledDepRegExp = hasWildcard
            ? wildcardPathToRegExp(depPath)
            : null;
          const matchDepPath = hasWildcard
            ? (fieldName: string) => compiledDepRegExp!.test(fieldName)
            : (fieldName: string) => fieldName === depPath;
          const existing = dependentsMapBuilt.get(depPath) ?? [];
          const alreadyRegistered = existing.some(
            (entry) => entry.targetSchemaPath === schemaPath,
          );

          if (!alreadyRegistered) {
            existing.push({ targetSchemaPath: schemaPath, matchDepPath });
          }

          dependentsMapBuilt.set(depPath, existing);
        });
      });
    });

    dependentsMapCacheRef.current = dependentsMapBuilt;
    syncValidationState();
  }, [config, formRef, syncValidationState]);

  const getAllFormFields = React.useCallback((): FormFieldElement[] => {
    const form = formRef.current;

    if (!isDefined(form)) {
      return [];
    }

    return Array.from(form.elements).filter(
      (element): element is FormFieldElement => {
        return isFormField(element) && isDefined(element.getAttribute("name"));
      },
    );
  }, [formRef]);

  const getCurrentModel = React.useCallback(
    (externalFormData?: FormData): T => {
      const form = formRef.current;

      if (!isDefined(form)) {
        return {} as T;
      }

      return readFormModel<T>(form, externalFormData);
    },
    [formRef],
  );

  const resolveFieldElements = React.useCallback(
    (form: HTMLFormElement, fieldName: string): FormFieldElement[] => {
      const item = form.elements.namedItem(fieldName);

      if (!isDefined(item)) {
        return [];
      }

      if (item instanceof RadioNodeList) {
        return Array.from(item).filter(isFormField);
      }

      if (isFormField(item)) {
        return [item];
      }

      return [];
    },
    [],
  );

  const resolveDependentFieldNames = React.useCallback(
    (changedFieldName: string): string[] => {
      const dependentNames = new Set<string>();
      const changedIndex = extractArrayIndex(changedFieldName);

      dependentsMapCacheRef.current.forEach((entries) => {
        entries.forEach(({ targetSchemaPath, matchDepPath }) => {
          if (!matchDepPath(changedFieldName)) {
            return;
          }

          if (targetSchemaPath.includes("*") && isDefined(changedIndex)) {
            dependentNames.add(
              resolveWildcardWithIndex(targetSchemaPath, changedIndex),
            );
            return;
          }

          dependentNames.add(targetSchemaPath);
        });
      });

      return Array.from(dependentNames);
    },
    [],
  );

  const findMatchingRules = React.useCallback(
    (fieldName: string): CustomValidationRule<T>[] => {
      const matchingRules: CustomValidationRule<T>[] = [];

      schemaIndexRef.current.forEach(({ matchFieldName, rulesAll }) => {
        if (matchFieldName(fieldName)) {
          matchingRules.push(...rulesAll);
        }
      });

      return matchingRules;
    },
    [],
  );

  const updateFieldState = React.useCallback(
    (
      fieldName: string,
      result: NormalizedValidationResult | undefined,
      options?: { dirty?: boolean; touched?: boolean },
    ) => {
      const previous = fieldStatesRef.current[fieldName];
      const blocking = result ? isBlockingResult(result) : false;

      fieldStatesRef.current[fieldName] = {
        name: fieldName,
        valid: !blocking,
        status: validationResultToStatus(result),
        message: result?.message,
        blocking,
        touched: options?.touched ?? previous?.touched ?? false,
        dirty: options?.dirty ?? previous?.dirty ?? false,
        source: result?.source,
      };

      syncValidationState();
    },
    [syncValidationState],
  );

  const validateFieldRef = React.useRef<
    (fieldName: string, options?: ValidateFieldOptions<T>) => Promise<boolean>
  >(async () => true);

  const validateField = React.useCallback(
    async (
      fieldName: string,
      options?: ValidateFieldOptions<T>,
    ): Promise<boolean> => {
      const form = formRef.current;

      if (!isDefined(form)) {
        return true;
      }

      const elements = resolveFieldElements(form, fieldName);
      if (elements.length === 0) {
        delete fieldStatesRef.current[fieldName];
        syncValidationState();
        return true;
      }

      const primaryElement = elements[0];
      const matchingRules = findMatchingRules(fieldName);
      const defaultMode = resolveFeedbackMode(configRef.current);
      const previousAbort = validationAbortRef.current.get(fieldName);

      previousAbort?.abort();

      const abortController = new AbortController();
      validationAbortRef.current.set(fieldName, abortController);
      isValidatingFieldsRef.current.set(fieldName, true);
      syncValidationState();

      try {
        const nativeResult = normalizeNativeResult(primaryElement);
        let resultToApply: NormalizedValidationResult | undefined =
          nativeResult ?? undefined;
        let resultMode = defaultMode;

        if (!nativeResult && matchingRules.length > 0) {
          const value = readFieldValue(primaryElement);
          const model = options?.externalModel ?? getCurrentModel();
          let firstBlockingResult: NormalizedValidationResult | undefined;
          let firstNonBlockingResult: NormalizedValidationResult | undefined;
          let resultRule: CustomValidationRule<T> | undefined;

          for (const rule of matchingRules) {
            if (abortController.signal.aborted) {
              break;
            }

            const ruleResultOrPromise = rule.validate(
              value,
              model,
              options?.event,
            );
            const ruleResult =
              ruleResultOrPromise instanceof Promise
                ? await ruleResultOrPromise
                : ruleResultOrPromise;
            const normalizedResult = normalizeCustomResult(ruleResult);

            if (abortController.signal.aborted) {
              break;
            }

            if (isBlockingResult(normalizedResult)) {
              firstBlockingResult = normalizedResult;
              resultRule = rule;
              break;
            }

            if (normalizedResult.message && !firstNonBlockingResult) {
              firstNonBlockingResult = normalizedResult;
              resultRule = rule;
            }
          }

          resultToApply = firstBlockingResult ?? firstNonBlockingResult;
          resultMode = resolveFeedbackMode(configRef.current, resultRule);
        }

        if (abortController.signal.aborted) {
          return true;
        }

        const blockingResult = resultToApply
          ? isBlockingResult(resultToApply)
          : false;
        if (options?.markKnown && blockingResult) {
          validationKnownRef.current = true;
        }

        const shouldReportNative =
          Boolean(options?.reportNative) &&
          (resultMode === "native" || resultMode === "both");
        const shouldFocus = Boolean(
          options?.allowInvalidFocus && blockingResult,
        );

        applyFieldFeedback(primaryElement, resultToApply, resultMode, {
          reportNative: shouldReportNative,
          allowInvalidFocus: shouldFocus,
        });

        if (!resultToApply || !isBlockingResult(resultToApply)) {
          invalidBlurFocusAttemptedRef.current.delete(fieldName);
        }

        updateFieldState(fieldName, resultToApply, {
          dirty:
            options?.event?.type === "input" ||
            options?.event?.type === "change",
          touched: options?.event?.type === "blur" || options?.markKnown,
        });

        if (!options?.skipDependents) {
          const dependentFieldNames = resolveDependentFieldNames(fieldName);
          await Promise.all(
            dependentFieldNames.map((depName) =>
              validateFieldRef.current(depName, { skipDependents: true }),
            ),
          );
        }

        return !blockingResult;
      } finally {
        if (validationAbortRef.current.get(fieldName) === abortController) {
          isValidatingFieldsRef.current.delete(fieldName);
          validationAbortRef.current.delete(fieldName);
          syncValidationState();
        }
      }
    },
    [
      findMatchingRules,
      formRef,
      getCurrentModel,
      resolveDependentFieldNames,
      resolveFieldElements,
      syncValidationState,
      updateFieldState,
    ],
  );

  React.useLayoutEffect(() => {
    validateFieldRef.current = validateField;
  }, [validateField]);

  const debouncedValidatorsRef = React.useRef<
    Map<
      string,
      ReturnType<typeof createDebounce<[string, ValidateFieldOptions<T>?]>>
    >
  >(new Map());

  const getDebouncedValidator = React.useCallback((fieldName: string) => {
    if (!debouncedValidatorsRef.current.has(fieldName)) {
      const { debounce = 300 } = configRef.current;
      const created = createDebounce(
        (name: string, options?: ValidateFieldOptions<T>) =>
          validateFieldRef.current(name, options),
        debounce,
      );
      debouncedValidatorsRef.current.set(fieldName, created);
    }

    return debouncedValidatorsRef.current.get(fieldName)!;
  }, []);

  const shouldReportInvalidOnBlur = React.useCallback(
    (fieldName: string): boolean => {
      const { invalidBlurFocusStrategy = "once" } = configRef.current;

      if (invalidBlurFocusStrategy === "never") {
        return false;
      }

      if (invalidBlurFocusStrategy === "always") {
        return true;
      }

      if (invalidBlurFocusAttemptedRef.current.has(fieldName)) {
        return false;
      }

      invalidBlurFocusAttemptedRef.current.add(fieldName);
      return true;
    },
    [],
  );

  const clearPendingValidationForField = React.useCallback(
    (fieldName: string): void => {
      debouncedValidatorsRef.current.get(fieldName)?.cancel();

      const pendingValidation = validationAbortRef.current.get(fieldName);
      if (pendingValidation) {
        pendingValidation.abort();
        validationAbortRef.current.delete(fieldName);
      }

      if (isValidatingFieldsRef.current.delete(fieldName)) {
        syncValidationState();
      }
    },
    [syncValidationState],
  );

  const clearFieldStateForTyping = React.useCallback(
    (fieldName: string, target: FormFieldElement): void => {
      const feedbackMode = resolveFeedbackMode(configRef.current);

      clearTypingFeedback(target, feedbackMode);
      invalidBlurFocusAttemptedRef.current.delete(fieldName);
      delete fieldStatesRef.current[fieldName];
      syncValidationState();
    },
    [syncValidationState],
  );

  const handleChangeEvent = React.useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      if (!isFormField(target)) {
        return;
      }

      const isTextLike =
        (target instanceof HTMLInputElement &&
          !["checkbox", "radio"].includes(target.type)) ||
        target instanceof HTMLTextAreaElement;
      if (isTextLike && event.type === "change") {
        return;
      }

      const fieldName = target.getAttribute("name");
      if (!isDefined(fieldName)) {
        return;
      }

      clearPendingValidationForField(fieldName);
      clearFieldStateForTyping(fieldName, target);

      const { validateOnChange = true } = configRef.current;
      if (!validateOnChange) {
        return;
      }

      const { debounced } = getDebouncedValidator(fieldName);
      debounced(fieldName, {
        event,
        markKnown: true,
        reportNative: true,
        allowInvalidFocus: false,
      });
    },
    [
      clearFieldStateForTyping,
      clearPendingValidationForField,
      getDebouncedValidator,
    ],
  );

  const handleBlurEvent = React.useCallback(
    (event: Event) => {
      const { validateOnBlur = true } = configRef.current;

      if (!validateOnBlur) {
        return;
      }

      const target = event.target as HTMLElement;
      if (!isFormField(target)) {
        return;
      }

      const fieldName = target.getAttribute("name");
      if (!isDefined(fieldName)) {
        return;
      }

      debouncedValidatorsRef.current.get(fieldName)?.cancel();

      const feedbackMode = resolveFeedbackMode(configRef.current);
      const shouldReportNative =
        (feedbackMode === "native" || feedbackMode === "both") &&
        shouldReportInvalidOnBlur(fieldName);

      validateFieldRef.current(fieldName, {
        event,
        reportNative: shouldReportNative,
        allowInvalidFocus: false,
        markKnown: true,
      });
    },
    [shouldReportInvalidOnBlur],
  );

  const cleanupRemovedFieldNames = React.useCallback(
    (removedFieldNames: Set<string>): void => {
      removedFieldNames.forEach((fieldName) => {
        debouncedValidatorsRef.current.get(fieldName)?.cancel();
        debouncedValidatorsRef.current.delete(fieldName);
        validationAbortRef.current.get(fieldName)?.abort();
        validationAbortRef.current.delete(fieldName);
        isValidatingFieldsRef.current.delete(fieldName);
        delete fieldStatesRef.current[fieldName];
      });

      syncValidationState();
    },
    [syncValidationState],
  );

  React.useEffect(() => {
    const form = formRef.current;

    if (!isDefined(form)) {
      return;
    }

    const debouncedValidatorsSnapshot = debouncedValidatorsRef.current;
    const validationAbortSnapshot = validationAbortRef.current;
    const isValidatingFieldsSnapshot = isValidatingFieldsRef.current;

    form.addEventListener("input", handleChangeEvent);
    form.addEventListener("change", handleChangeEvent);
    form.addEventListener("blur", handleBlurEvent, true);

    const cleanupObserver = new MutationObserver((mutations) => {
      const removedFieldNames = new Set<string>();

      mutations.forEach((mutation) => {
        if (
          mutation.type !== "childList" ||
          mutation.removedNodes.length === 0
        ) {
          return;
        }

        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          if (isFormField(node)) {
            const name = node.getAttribute("name");
            if (isDefined(name)) {
              removedFieldNames.add(name);
            }
          }

          node
            .querySelectorAll<FormFieldElement>(
              "input[name], select[name], textarea[name]",
            )
            .forEach((element) => {
              const name = element.getAttribute("name");
              if (isDefined(name)) {
                removedFieldNames.add(name);
              }
            });
        });
      });

      if (removedFieldNames.size > 0) {
        cleanupRemovedFieldNames(removedFieldNames);
      }
    });

    cleanupObserver.observe(form, { childList: true, subtree: true });

    return () => {
      form.removeEventListener("input", handleChangeEvent);
      form.removeEventListener("change", handleChangeEvent);
      form.removeEventListener("blur", handleBlurEvent, true);
      cleanupObserver.disconnect();
      debouncedValidatorsSnapshot.forEach(({ cancel }) => cancel());
      debouncedValidatorsSnapshot.clear();
      validationAbortSnapshot.forEach((controller) => controller.abort());
      validationAbortSnapshot.clear();
      isValidatingFieldsSnapshot.clear();
    };
  }, [cleanupRemovedFieldNames, formRef, handleBlurEvent, handleChangeEvent]);

  const resolveScopeFieldNames = React.useCallback(
    (scope?: ValidateScopeTarget): string[] => {
      const form = formRef.current;

      if (!isDefined(form)) {
        return [];
      }

      if (Array.isArray(scope)) {
        return Array.from(new Set(scope.filter((name) => name.trim() !== "")));
      }

      const fieldsFromRoot = (root: HTMLElement | HTMLFormElement) => {
        return root === form
          ? getAllFormFields()
          : Array.from(
            root.querySelectorAll<FormFieldElement>(
              "input[name], select[name], textarea[name]",
            ),
          ).filter(isFormField);
      };

      const toFieldNames = (fields: FormFieldElement[]) => {
        return Array.from(
          new Set(
            fields
              .map((field) => field.getAttribute("name"))
              .filter(isDefined),
          ),
        );
      };

      if (typeof scope === "string") {
        const allFieldNames = toFieldNames(fieldsFromRoot(form));

        const scopedFieldNames = allFieldNames.filter((fieldName) => {
          return (
            fieldName === scope ||
            fieldName.startsWith(`${scope}.`) ||
            fieldName.startsWith(`${scope}[`)
          );
        });

        return scopedFieldNames.length > 0 ? scopedFieldNames : [scope];
      }

      const root = scope instanceof HTMLElement ? scope : form;

      return toFieldNames(fieldsFromRoot(root));
    },
    [formRef, getAllFormFields],
  );

  const validateScope = React.useCallback(
    async (
      scope?: ValidateScopeTarget,
      options?: {
        event?: Event;
        externalModel?: T;
        reportNative?: boolean;
        markKnown?: boolean;
      },
    ): Promise<boolean> => {
      const form = formRef.current;

      if (!isDefined(form)) {
        return true;
      }

      if (options?.markKnown ?? true) {
        validationKnownRef.current = true;
      }

      const submitModel =
        options?.externalModel ?? getCurrentModel(new FormData(form));
      const fieldNames = resolveScopeFieldNames(scope);
      let firstInvalidFieldName: string | undefined;
      let allValid = true;

      for (const name of fieldNames) {
        const isFieldValid = await validateField(name, {
          event: options?.event,
          skipDependents: true,
          externalModel: submitModel,
          reportNative:
            Boolean(options?.reportNative) &&
            firstInvalidFieldName === undefined,
          markKnown: options?.markKnown ?? true,
        });

        if (!isFieldValid) {
          allValid = false;
          firstInvalidFieldName ??= name;
        }
      }

      const { focusFirstInvalidOnSubmit = true } = configRef.current;
      if (!allValid && focusFirstInvalidOnSubmit && firstInvalidFieldName) {
        const firstInvalidElement = resolveFieldElements(
          form,
          firstInvalidFieldName,
        )[0];
        const feedbackMode = resolveFeedbackMode(configRef.current);

        if (firstInvalidElement && feedbackMode === "helper") {
          window.requestAnimationFrame(() => firstInvalidElement.focus());
        }
      }

      syncValidationState();
      return allValid;
    },
    [
      formRef,
      getCurrentModel,
      resolveFieldElements,
      resolveScopeFieldNames,
      syncValidationState,
      validateField,
    ],
  );

  const validate = React.useCallback(async (): Promise<boolean> => {
    return validateScope(undefined, { reportNative: true, markKnown: true });
  }, [validateScope]);

  const clearErrors = React.useCallback((): void => {
    const mode = resolveFeedbackMode(configRef.current);

    getAllFormFields().forEach((element) => clearFieldFeedback(element, mode));
    invalidBlurFocusAttemptedRef.current.clear();
    fieldStatesRef.current = {};
    validationKnownRef.current = false;
    syncValidationState();
  }, [getAllFormFields, syncValidationState]);

  const getValidationState = React.useCallback(() => buildValidationState(), [buildValidationState]);
  const getFieldState = React.useCallback((fieldName: string) => fieldStatesRef.current[fieldName], []);
  const isValid = React.useCallback(() => buildValidationState().valid, [buildValidationState]);
  const hasErrors = React.useCallback(() => buildValidationState().hasErrors, [buildValidationState]);

  const validateFieldPublic = React.useCallback((fieldName: string, options?: ValidateFieldOptions<T>): Promise<boolean> => {
    return validateField(fieldName, {
      ...options,
      reportNative: options?.reportNative ?? true,
      markKnown: options?.markKnown ?? true,
    });
  }, [validateField]);

  const validateScopePublic = React.useCallback((scope?: ValidateScopeTarget, options?: ValidateFieldOptions<T>): Promise<boolean> => {
    return validateScope(scope, {
      ...options,
      reportNative: options?.reportNative ?? true,
      markKnown: options?.markKnown ?? true,
    });
  }, [validateScope]);

  return {
    isValidating, validationState,
    validate, validateField: validateFieldPublic, validateScope: validateScopePublic, clearErrors, isValid, hasErrors,
    getValidationState, getFieldState
  };
}
