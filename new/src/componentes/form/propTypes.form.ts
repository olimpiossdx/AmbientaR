import React from "react";
import type {
 FieldValidationState,
 ValidateFieldPublicOptions,
 ValidateScopeOptions,
 ValidateScopeTarget,
 ValidationConfig,
 ValidationState,
} from "../../hook/use-validation.type";
import type { Path, PathValue } from "../../utils/path";

export type MaybePromise<T> = T | Promise<T>;

export type FormStatus = "idle" | "submitting" | "success" | "error";

export type ApiServiceNotificationStatus =
 | "success"
 | "error"
 | "warning"
 | "info"
 | "neutral";

export type ApiServiceNotificationChannel =
 | "toast"
 | "alert"
 | "manual"
 | "none";

export type ApiServiceNotificationScope = "global" | "form" | "field";

export interface ApiServiceNotificationAction {
 label: string;
 onClick: () => void;
 closeOnClick?: boolean;
}

export interface ApiServiceNotification {
 id?: string;
 status: ApiServiceNotificationStatus;
 title?: React.ReactNode;
 message: React.ReactNode;
 channels?: ApiServiceNotificationChannel[];
 scope?: ApiServiceNotificationScope;
 fieldName?: string;
 duration?: number;
 delay?: number;
 dismissible?: boolean;
 position?:
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";
 size?: "normal" | "large";
 action?: ApiServiceNotificationAction;
 className?: string;
 meta?: Record<string, unknown>;
}

export interface ApiServiceResponse<TData = unknown> {
 ok: boolean;
 status?: ApiServiceNotificationStatus;
 data?: TData;
 error?: unknown;
 message?: React.ReactNode;
 title?: React.ReactNode;
 notifications?: ApiServiceNotification[];
 meta?: Record<string, unknown>;
}

export type FormNotificationMode = "auto" | "manual" | "hybrid";

export type FormDefaultNotifications = {
 concurrentSubmit?: ApiServiceNotification | ApiServiceNotification[] | false;
 unexpectedError?: ApiServiceNotification | ApiServiceNotification[] | false;
 success?: ApiServiceNotification | ApiServiceNotification[] | false;
};

export type FormContext<TModel = Record<string, unknown>, TResult = unknown> = {
 submit: () => void;
 reset: () => void;
 resetField: (path: string) => void;
 resetSection: (path: string) => void;
 validate: () => Promise<boolean>;
 validateField: (fieldName: string, options?: ValidateFieldPublicOptions<TModel>) => Promise<boolean>;
 validateScope: (scope?: ValidateScopeTarget, options?: ValidateScopeOptions<TModel>) => Promise<boolean>;
 clearErrors: () => void;
 getModel: () => TModel | null;
 setFieldValue: <P extends Path<TModel>>(
  path: P,
  value: PathValue<TModel, P>,
 ) => void;
 getFieldValue: <P extends Path<TModel>>(
  path: P,
 ) => PathValue<TModel, P> | null;
 dispatchNotifications: (
  notifications: ApiServiceNotification | ApiServiceNotification[],
 ) => void;
 clearNotifications: () => void;
 getLastResponse: () => ApiServiceResponse<TResult> | null;
 getStatus: () => FormStatus;
 isSubmitting: () => boolean;
 isBusy: () => boolean;
 isValid: () => boolean;
 hasErrors: () => boolean;
 getValidationState: () => ValidationState;
 getFieldState: (fieldName: string) => FieldValidationState | undefined;
 isValidating: boolean;
 validationState: ValidationState;
};

export type FormSubmitContext<
 TModel = Record<string, unknown>,
 TResult = unknown,
> = FormContext<TModel, TResult> & {
 event: React.SubmitEvent<HTMLFormElement>;
 submitter: HTMLElement | null;
 submissionId: number;
};

export type FormSubmitReturn<TResult = unknown> =
 | void
 | ApiServiceResponse<TResult>
 | TResult;

export interface IFormProps<
 TModel = Record<string, unknown>,
 TResult = unknown,
> extends Omit<
 React.FormHTMLAttributes<HTMLFormElement>,
 "children" | "onSubmit" | "onReset"
> {
 id?: string;
 model?: Partial<TModel>;
 validation?: ValidationConfig<TModel>;
 children:
  | React.ReactNode
  | ((ctx: FormContext<TModel, TResult>) => React.ReactNode);
 actions?:
  | React.ReactNode
  | ((ctx: FormContext<TModel, TResult>) => React.ReactNode);

 onSubmit: (
  model: TModel,
  ctx: FormSubmitContext<TModel, TResult>,
 ) => MaybePromise<FormSubmitReturn<TResult>>;

 onSubmitStart?: (ctx: FormSubmitContext<TModel, TResult>) => void;
 onSubmitSuccess?: (
  response: ApiServiceResponse<TResult> | null,
  ctx: FormSubmitContext<TModel, TResult>,
 ) => void;
 onSubmitError?: (
  error: unknown,
  response: ApiServiceResponse<TResult> | null,
  ctx: FormSubmitContext<TModel, TResult>,
 ) => void;
 onSubmitFinally?: (ctx: FormSubmitContext<TModel, TResult>) => void;

 manageActionsOnSubmit?: boolean;
 preventConcurrentSubmit?: boolean;
 /**
  * Quando true, permite desabilitar ações submit gerenciadas após o formulário
  * ficar conhecido e inválido, mas somente quando o feedbackMode inclui helper
  * ("helper" ou "both"). Em modo "native", o submit continua habilitado
  * para preservar o fluxo nativo de reportValidity. Em "silent", o programador
  * controla a reação pela API exposta.
  */
 disableSubmitWhenInvalid?: boolean;

 notificationMode?: FormNotificationMode;
 defaultNotificationChannels?: ApiServiceNotificationChannel[];
 defaultNotifications?: FormDefaultNotifications;
 resolveSubmitResponse?: (
  result: FormSubmitReturn<TResult>,
  ctx: FormSubmitContext<TModel, TResult>,
 ) => MaybePromise<ApiServiceResponse<TResult> | void | null>;
 resolveNotifications?: (
  notifications: ApiServiceNotification[],
  response: ApiServiceResponse<TResult> | null,
  ctx: FormSubmitContext<TModel, TResult>,
 ) => MaybePromise<ApiServiceNotification[]>;
 onNotifications?: (
  notifications: ApiServiceNotification[],
  response: ApiServiceResponse<TResult> | null,
  ctx: FormSubmitContext<TModel, TResult>,
 ) => void;

 clearAlertsOnSubmit?: boolean;
 clearAlertsOnReset?: boolean;
 actionsClassName?: string;
}

export const FORM_ALERT_REGION_API = Symbol.for(
 "ambientar.form-alert-region.api.v1",
);

export interface IFormAlertRegionAPI {
 show: (notifications: ApiServiceNotification[]) => void;
 clear: () => void;
 readonly instanceId: string;
 readonly isMounted: boolean;
}

export interface IElementWithFormAlertRegionAPI extends HTMLElement {
 [FORM_ALERT_REGION_API]?: IFormAlertRegionAPI;
}

export interface IFormAlertRegionProps extends React.HTMLAttributes<HTMLDivElement> {
 maxItems?: number;
 clearBeforeShow?: boolean;
}
