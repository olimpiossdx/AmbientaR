import React from "react";
import { cn } from "@sglara/cn";
import { toast } from "../toast/toast";
import {
  MANAGED_BUTTON_ACTION_API,
  type IButtonElementWithManagedActionAPI,
} from "../button/propTypes.button";
import { useForm } from "../../hook/use-from";
import { FORM_VALIDATION_STATE_CHANGE_EVENT } from "../../hook/use-validation";
import {
  FORM_ALERT_REGION_API,
  type ApiServiceNotification,
  type ApiServiceNotificationChannel,
  type ApiServiceResponse,
  type FormContext,
  type FormStatus,
  type FormSubmitContext,
  type IElementWithFormAlertRegionAPI,
  type IFormProps,
} from "./propTypes.form";
import type {
  FieldValidationState,
  ValidateFieldPublicOptions,
  ValidateScopeOptions,
  ValidateScopeTarget,
  ValidationState,
} from "../../hook/use-validation.type";

const UNKNOWN_VALIDATION_STATE: ValidationState = {
  known: false,
  valid: true,
  hasErrors: false,
  validating: false,
  fields: {},
};

type FormApiValidationCompat = {
  commit?: () => void;
  resetField?: (path: string) => void;
  resetSection?: (path: string) => void;
  validateField?: (
    fieldName: string,
    options?: ValidateFieldPublicOptions<unknown>,
  ) => Promise<boolean>;
  validateScope?: (
    scope?: ValidateScopeTarget,
    options?: ValidateScopeOptions<unknown>,
  ) => Promise<boolean>;
  validationState?: ValidationState;
  getValidationState?: () => ValidationState;
  getFieldState?: (fieldName: string) => FieldValidationState | undefined;
  isValid?: () => boolean;
  hasErrors?: () => boolean;
};

type FormValidationStateChangeEvent = CustomEvent<ValidationState>;

function toArray<T>(value: T | T[] | false | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function isApiServiceResponse<TResult>(
  value: unknown,
): value is ApiServiceResponse<TResult> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  if (!("ok" in value)) {
    return false;
  }

  return typeof (value as { ok?: unknown }).ok === "boolean";
}

function getErrorMessage(error: unknown): React.ReactNode | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" || React.isValidElement(message)) {
      return message as React.ReactNode;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return undefined;
}

function normalizeApiNotification(
  notification: ApiServiceNotification & { field?: string },
): ApiServiceNotification {
  const fieldName = notification.fieldName ?? notification.field;

  return {
    ...notification,
    fieldName,
    scope: notification.scope ?? (fieldName ? "field" : undefined),
  };
}

function getSubmitter(
  event: React.SubmitEvent<HTMLFormElement>,
): HTMLElement | null {
  const nativeSubmitter = (event.nativeEvent as SubmitEvent | undefined)
    ?.submitter;

  if (nativeSubmitter instanceof HTMLElement) {
    return nativeSubmitter;
  }

  const eventSubmitter = (event as unknown as SubmitEvent | undefined)
    ?.submitter;

  if (eventSubmitter instanceof HTMLElement) {
    return eventSubmitter;
  }

  return null;
}

function getManagedActionApi(element: Element) {
  return (element as IButtonElementWithManagedActionAPI)[
    MANAGED_BUTTON_ACTION_API
  ];
}

function getManagedActionElements(form: HTMLFormElement): HTMLElement[] {
  return Array.from(
    form.querySelectorAll<HTMLElement>("[data-managed-action]"),
  ).filter((element) => {
    return Boolean(getManagedActionApi(element));
  });
}

function normalizeChannels(
  channels: ApiServiceNotificationChannel[] | undefined,
  defaults: ApiServiceNotificationChannel[],
): ApiServiceNotificationChannel[] {
  if (!channels || channels.length === 0) {
    return defaults;
  }

  if (channels.includes("none")) {
    return [];
  }

  return channels;
}

function createNotificationFromResponse<TResult>(
  response: ApiServiceResponse<TResult>,
  defaultChannels: ApiServiceNotificationChannel[],
): ApiServiceNotification[] {
  if (response.notifications && response.notifications.length > 0) {
    return response.notifications.map((notification) =>
      normalizeApiNotification(
        notification as ApiServiceNotification & { field?: string },
      ),
    );
  }

  const message = response.message ?? getErrorMessage(response.error);

  if (!message) {
    return [];
  }

  return [
    {
      status: response.status ?? (response.ok ? "success" : "error"),
      title: response.title,
      message,
      channels: defaultChannels,
    } as ApiServiceNotification,
  ];
}

function isSubmitManagedActionElement(element: HTMLElement): boolean {
  return element instanceof HTMLButtonElement && element.type === "submit";
}

function feedbackModeIncludesHelper(feedbackMode: string | undefined): boolean {
  return feedbackMode === "helper" || feedbackMode === "both";
}

function normalizeUnexpectedErrorNotification(
  error: unknown,
): ApiServiceNotification {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível concluir a operação.";

  return {
    status: "error",
    title: "Erro inesperado",
    message,
    channels: ["alert"],
    duration: Infinity,
  };
}

function dispatchToast(notification: ApiServiceNotification): void {
  const options = {
    id: notification.id,
    title: notification.title,
    duration: notification.duration,
    action: notification.action,
    position: notification.position,
    icon: undefined,
    size: notification.size,
    dismissible: notification.dismissible,
    className: notification.className,
  };

  if (notification.status === "success") {
    toast.success(notification.message, options);
    return;
  }

  if (notification.status === "error") {
    toast.error(notification.message, options);
    return;
  }

  if (notification.status === "warning") {
    toast.warning(notification.message, options);
    return;
  }

  if (notification.status === "info") {
    toast.info(notification.message, options);
    return;
  }

  toast.custom(notification.message, options);
}

function findAlertRegion(form: HTMLFormElement) {
  const region = form.querySelector<HTMLElement>("[data-form-alert-region]");

  if (!region) {
    return undefined;
  }

  return (region as IElementWithFormAlertRegionAPI)[FORM_ALERT_REGION_API];
}

const FormBase = React.forwardRef<HTMLFormElement, IFormProps<any, any>>(
  function FormComponent<TModel = Record<string, unknown>, TResult = unknown>(
    {
      id,
      model,
      validation,
      children,
      actions,
      onSubmit,
      onSubmitStart,
      onSubmitSuccess,
      onSubmitError,
      onSubmitFinally,
      manageActionsOnSubmit = true,
      preventConcurrentSubmit = true,
      disableSubmitWhenInvalid = false,
      notificationMode = "auto",
      defaultNotificationChannels = [],
      defaultNotifications,
      resolveSubmitResponse,
      resolveNotifications,
      onNotifications,
      clearAlertsOnSubmit = true,
      clearAlertsOnReset = true,
      className,
      actionsClassName,
      ...props
    }: IFormProps<TModel, TResult>,
    ref: React.ForwardedRef<HTMLFormElement>,
  ) {
    const generatedId = React.useId();
    const formId = id ?? generatedId;

    const formRef = React.useRef<HTMLFormElement | null>(null);
    const formApiRef = React.useRef<FormApiValidationCompat | null>(null);
    const latestCtxRef = React.useRef<FormContext<TModel, TResult> | null>(
      null,
    );
    const isSubmittingRef = React.useRef(false);
    const isMountedRef = React.useRef(false);
    const isManagedResetRef = React.useRef(false);
    const statusRef = React.useRef<FormStatus>("idle");
    const submissionIdRef = React.useRef(0);
    const lastResponseRef = React.useRef<ApiServiceResponse<TResult> | null>(
      null,
    );
    const delayedNotificationTimersRef = React.useRef<number[]>([]);
    const [validationStateSnapshot, setValidationStateSnapshot] =
      React.useState<ValidationState>(UNKNOWN_VALIDATION_STATE);

    const lockedActionsRef = React.useRef<{
      elements: HTMLElement[];
      submitter: HTMLElement | null;
      submissionId: number;
    } | null>(null);

    React.useEffect(() => {
      isMountedRef.current = true;

      return () => {
        isMountedRef.current = false;
        delayedNotificationTimersRef.current.forEach(window.clearTimeout);
        delayedNotificationTimersRef.current = [];
      };
    }, []);

    const lockManagedActions = React.useCallback(
      (
        form: HTMLFormElement,
        submitter: HTMLElement | null,
        submissionId: number,
      ) => {
        if (!manageActionsOnSubmit) {
          return;
        }

        const elements = getManagedActionElements(form);
        lockedActionsRef.current = { elements, submitter, submissionId };

        elements.forEach((element) => {
          const api = getManagedActionApi(element);

          if (!api?.isMounted) {
            return;
          }

          if (submitter && element === submitter) {
            api.setLoading(true);
            return;
          }

          api.setDisabled(true);
        });
      },
      [manageActionsOnSubmit],
    );

    const unlockManagedActions = React.useCallback((submissionId: number) => {
      const locked = lockedActionsRef.current;

      if (!locked || locked.submissionId !== submissionId) {
        return;
      }

      locked.elements.forEach((element) => {
        const api = getManagedActionApi(element);

        if (!api?.isMounted) {
          return;
        }

        if (locked.submitter && element === locked.submitter) {
          api.setLoading(false);
          return;
        }

        api.setDisabled(false);
      });

      lockedActionsRef.current = null;
    }, []);

    const clearNotifications = React.useCallback(() => {
      const form = formRef.current;

      if (!form) {
        return;
      }

      findAlertRegion(form)?.clear();
    }, []);

    const notifyManually = React.useCallback(
      (notifications: ApiServiceNotification[]) => {
        if (notifications.length === 0) {
          return;
        }

        onNotifications?.(
          notifications,
          lastResponseRef.current,
          latestCtxRef.current as FormSubmitContext<TModel, TResult>,
        );
      },
      [onNotifications],
    );

    const dispatchDelayedToast = React.useCallback(
      (notification: ApiServiceNotification) => {
        if (!notification.delay || notification.delay <= 0) {
          dispatchToast(notification);
          return;
        }

        const timer = window.setTimeout(() => {
          delayedNotificationTimersRef.current =
            delayedNotificationTimersRef.current.filter(
              (item) => item !== timer,
            );

          if (!isMountedRef.current) {
            return;
          }

          dispatchToast({ ...notification, delay: 0 });
        }, notification.delay);

        delayedNotificationTimersRef.current.push(timer);
      },
      [],
    );

    const dispatchNotifications = React.useCallback(
      (input: ApiServiceNotification | ApiServiceNotification[]) => {
        const form = formRef.current;
        const notifications = Array.isArray(input) ? input : [input];

        if (notifications.length === 0) {
          return;
        }

        if (notificationMode === "manual") {
          notifyManually(notifications);
          return;
        }

        const normalizedNotifications = notifications.map((notification) => ({
          ...notification,
          channels: normalizeChannels(
            notification.channels,
            defaultNotificationChannels,
          ),
        }));

        const toastNotifications = normalizedNotifications.filter(
          (notification) => {
            return notification.channels?.includes("toast");
          },
        );

        const alertNotifications = normalizedNotifications.filter(
          (notification) => {
            return notification.channels?.includes("alert");
          },
        );

        const manualNotifications = normalizedNotifications.filter(
          (notification) => {
            return notification.channels?.includes("manual");
          },
        );

        toastNotifications.forEach(dispatchDelayedToast);

        if (form && alertNotifications.length > 0) {
          findAlertRegion(form)?.show(alertNotifications);
        }

        if (notificationMode === "hybrid") {
          notifyManually(normalizedNotifications);
          return;
        }

        notifyManually(manualNotifications);
      },
      [
        defaultNotificationChannels,
        dispatchDelayedToast,
        notificationMode,
        notifyManually,
      ],
    );

    const safeResolveNotifications = React.useCallback(
      async (
        notifications: ApiServiceNotification[],
        response: ApiServiceResponse<TResult> | null,
        ctx: FormSubmitContext<TModel, TResult>,
      ): Promise<ApiServiceNotification[]> => {
        if (!resolveNotifications) {
          return notifications;
        }

        try {
          const resolvedNotifications = await resolveNotifications(
            notifications,
            response,
            ctx,
          );
          return resolvedNotifications ?? [];
        } catch (error) {
          console.error("Erro ao resolver notificações do Form.", error);
          return notifications;
        }
      },
      [resolveNotifications],
    );

    const formApi = useForm<TModel>({
      id: formId,
      model,
      validation,
      onSubmit: async (submittedModel, event) => {
        const form = event.currentTarget as HTMLFormElement;
        const submitter = getSubmitter(event);

        if (preventConcurrentSubmit && isSubmittingRef.current) {
          const ctx = latestCtxRef.current as FormSubmitContext<
            TModel,
            TResult
          > | null;
          const concurrentNotifications = toArray(
            defaultNotifications?.concurrentSubmit,
          );

          if (ctx && concurrentNotifications.length > 0) {
            dispatchNotifications(concurrentNotifications);
          }

          return;
        }

        const submissionId = submissionIdRef.current + 1;
        submissionIdRef.current = submissionId;
        isSubmittingRef.current = true;
        statusRef.current = "submitting";
        lastResponseRef.current = null;

        const baseCtx = latestCtxRef.current as FormContext<TModel, TResult>;
        const submitCtx: FormSubmitContext<TModel, TResult> = {
          ...baseCtx,
          event,
          submitter,
          submissionId,
        };

        if (clearAlertsOnSubmit) {
          findAlertRegion(form)?.clear();
        }

        lockManagedActions(form, submitter, submissionId);
        onSubmitStart?.(submitCtx);

        try {
          const rawResult = await onSubmit(submittedModel, submitCtx);
          const maybeResolvedResponse = resolveSubmitResponse
            ? await resolveSubmitResponse(rawResult, submitCtx)
            : rawResult;

          const resolvedResponse: ApiServiceResponse<TResult> | null =
            isApiServiceResponse<TResult>(maybeResolvedResponse)
              ? maybeResolvedResponse
              : null;

          const responseNotifications = resolvedResponse
            ? createNotificationFromResponse(
                resolvedResponse,
                defaultNotificationChannels,
              )
            : [];

          const successNotifications =
            resolvedResponse?.ok === true
              ? toArray(defaultNotifications?.success)
              : [];

          const mergedNotifications = [
            ...successNotifications,
            ...responseNotifications,
          ];
          const finalNotifications = await safeResolveNotifications(
            mergedNotifications,
            resolvedResponse,
            submitCtx,
          );

          lastResponseRef.current = resolvedResponse;
          statusRef.current =
            resolvedResponse?.ok === false ? "error" : "success";

          if (finalNotifications.length > 0) {
            dispatchNotifications(finalNotifications);
          }

          if (resolvedResponse?.ok === false) {
            onSubmitError?.(
              resolvedResponse.error ?? resolvedResponse,
              resolvedResponse,
              submitCtx,
            );
            return;
          }

          formApiRef.current?.commit?.();
          onSubmitSuccess?.(resolvedResponse, submitCtx);
        } catch (error) {
          const fallbackResponse: ApiServiceResponse<TResult> = {
            ok: false,
            status: "error",
            error,
            notifications:
              toArray(defaultNotifications?.unexpectedError).length > 0
                ? toArray(defaultNotifications?.unexpectedError)
                : [normalizeUnexpectedErrorNotification(error)],
          };

          const finalNotifications = await safeResolveNotifications(
            fallbackResponse.notifications ?? [],
            fallbackResponse,
            submitCtx,
          );

          lastResponseRef.current = fallbackResponse;
          statusRef.current = "error";

          if (finalNotifications.length > 0) {
            dispatchNotifications(finalNotifications);
          }

          onSubmitError?.(error, fallbackResponse, submitCtx);
        } finally {
          if (submissionIdRef.current === submissionId) {
            isSubmittingRef.current = false;
            unlockManagedActions(submissionId);
          }

          onSubmitFinally?.(submitCtx);
        }
      },
    });

    formApiRef.current = formApi as typeof formApi & FormApiValidationCompat;

    const validationCompat = formApi as typeof formApi &
      FormApiValidationCompat;
    const effectiveFeedbackMode =
      validation?.feedbackMode ?? validation?.mode ?? "native";
    const shouldAutoDisableSubmitByInvalidity =
      disableSubmitWhenInvalid &&
      feedbackModeIncludesHelper(effectiveFeedbackMode);

    const getSafeValidationState = React.useCallback((): ValidationState => {
      const apiState =
        validationCompat.getValidationState?.() ??
        validationCompat.validationState;

      if (apiState?.known || validationStateSnapshot.known) {
        return apiState?.known ? apiState : validationStateSnapshot;
      }

      return apiState ?? validationStateSnapshot ?? UNKNOWN_VALIDATION_STATE;
    }, [validationCompat, validationStateSnapshot]);

    React.useEffect(() => {
      const form = formRef.current;

      if (!form) {
        return;
      }

      const handleValidationStateChange = (event: Event) => {
        const validationEvent = event as FormValidationStateChangeEvent;

        if (!validationEvent.detail) {
          return;
        }

        setValidationStateSnapshot(validationEvent.detail);
      };

      form.addEventListener(
        FORM_VALIDATION_STATE_CHANGE_EVENT,
        handleValidationStateChange,
      );

      return () => {
        form.removeEventListener(
          FORM_VALIDATION_STATE_CHANGE_EVENT,
          handleValidationStateChange,
        );
      };
    }, [formApi.formProps.ref]);

    const safeIsValid = React.useCallback((): boolean => {
      return validationCompat.isValid?.() ?? getSafeValidationState().valid;
    }, [getSafeValidationState, validationCompat]);

    const safeHasErrors = React.useCallback((): boolean => {
      return (
        validationCompat.hasErrors?.() ?? getSafeValidationState().hasErrors
      );
    }, [getSafeValidationState, validationCompat]);

    const safeGetFieldState = React.useCallback(
      (fieldName: string): FieldValidationState | undefined => {
        return (
          validationCompat.getFieldState?.(fieldName) ??
          getSafeValidationState().fields[fieldName]
        );
      },
      [getSafeValidationState, validationCompat],
    );

    React.useEffect(() => {
      if (!shouldAutoDisableSubmitByInvalidity || !manageActionsOnSubmit) {
        return;
      }

      const form = formRef.current;
      if (!form) {
        return;
      }

      const validationState = getSafeValidationState();
      const shouldDisableSubmit =
        validationState.known &&
        validationState.valid === false &&
        !validationState.validating;

      getManagedActionElements(form)
        .filter(isSubmitManagedActionElement)
        .forEach((element) => {
          const api = getManagedActionApi(element);

          if (!api?.isMounted) {
            return;
          }

          api.setDisabled(shouldDisableSubmit);
        });
    }, [
      shouldAutoDisableSubmitByInvalidity,
      getSafeValidationState,
      manageActionsOnSubmit,
    ]);

    const setRefs = React.useCallback(
      (node: HTMLFormElement | null) => {
        formRef.current = node;

        const formApiRef = formApi.formProps.ref as
          | React.Ref<HTMLFormElement>
          | undefined;

        if (typeof formApiRef === "function") {
          formApiRef(node);
        } else if (formApiRef && "current" in formApiRef) {
          (
            formApiRef as React.MutableRefObject<HTMLFormElement | null>
          ).current = node;
        }

        if (typeof ref === "function") {
          ref(node);
          return;
        }

        if (ref) {
          ref.current = node;
        }
      },
      [formApi.formProps.ref, ref],
    );

    const reset = React.useCallback(() => {
      isManagedResetRef.current = true;
      formApi.reset();

      if (clearAlertsOnReset) {
        clearNotifications();
      }

      window.requestAnimationFrame(() => {
        isManagedResetRef.current = false;
      });
    }, [clearAlertsOnReset, clearNotifications, formApi.reset]);

    const handleNativeReset = React.useCallback(
      (event: React.FormEvent<HTMLFormElement>) => {
        if (isManagedResetRef.current) {
          return;
        }

        event.preventDefault();
        reset();
      },
      [reset],
    );

    const ctx = React.useMemo<FormContext<TModel, TResult>>(
      () => ({
        submit: formApi.submit,
        reset,
        resetField: (path: string) => {
          validationCompat.resetField?.(path);
        },
        resetSection: (path: string) => {
          validationCompat.resetSection?.(path);
        },
        validate: formApi.validate,
        validateField: (fieldName, options) => {
          return (
            validationCompat.validateField?.(
              fieldName,
              options as ValidateFieldPublicOptions<unknown>,
            ) ?? formApi.validate()
          );
        },
        validateScope: (scope, options) => {
          return (
            validationCompat.validateScope?.(
              scope,
              options as ValidateScopeOptions<unknown>,
            ) ?? formApi.validate()
          );
        },
        clearErrors: formApi.clearErrors,
        getModel: formApi.getModel,
        setFieldValue: formApi.setFieldValue,
        getFieldValue: formApi.getFieldValue,
        dispatchNotifications,
        clearNotifications,
        getLastResponse: () => lastResponseRef.current,
        getStatus: () => statusRef.current,
        isSubmitting: () => isSubmittingRef.current,
        isBusy: () => isSubmittingRef.current || formApi.isValidating,
        isValid: safeIsValid,
        hasErrors: safeHasErrors,
        getValidationState: getSafeValidationState,
        getFieldState: safeGetFieldState,
        isValidating: formApi.isValidating,
        validationState: getSafeValidationState(),
      }),
      [
        clearNotifications,
        dispatchNotifications,
        formApi.clearErrors,
        formApi.getFieldValue,
        formApi.getModel,
        getSafeValidationState,
        safeGetFieldState,
        safeHasErrors,
        safeIsValid,
        formApi.isValidating,
        formApi.setFieldValue,
        formApi.submit,
        formApi.validate,
        reset,
        validationCompat.resetField,
        validationCompat.resetSection,
        validationCompat.validateField,
        validationCompat.validateScope,
      ],
    );

    React.useLayoutEffect(() => {
      latestCtxRef.current = ctx;
    }, [ctx]);

    return (<form
        {...formApi.formProps}
        {...props}
        id={formApi.formProps.id}
        ref={setRefs}
        noValidate={props.noValidate ?? effectiveFeedbackMode !== "native"}
        onReset={handleNativeReset}
        className={cn(className)}
      >
        {typeof children === "function" ? children(ctx) : children}
        {actions && (
          <div className={actionsClassName}>
            {typeof actions === "function" ? actions(ctx) : actions}
          </div>
        )}
      </form>);
  },
);

FormBase.displayName = "Form";

export const Form = FormBase as <TModel = Record<string, unknown>,TResult = unknown,>(
  props: IFormProps<TModel, TResult> & React.RefAttributes<HTMLFormElement>) => React.ReactElement | null;
