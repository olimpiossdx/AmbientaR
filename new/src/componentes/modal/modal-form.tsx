import React from "react";

import Modal from "./modal";
import type { ModalClassNames, ModalSize } from "./modal.types";
import { cn } from "@sglara/cn";
import { useForm } from "../../hook/use-from";
import type {
 FieldValidationState,
 ValidationConfig,
 ValidationState,
} from "../../hook/use-validation.type";
import type { Path, PathValue } from "../../utils/path";

const UNKNOWN_VALIDATION_STATE: ValidationState = {
 known: false,
 valid: true,
 hasErrors: false,
 validating: false,
 fields: {},
};

type ModalFormApiValidationCompat = {
 resetSection?: (path: string) => void;
 validationState?: ValidationState;
 getValidationState?: () => ValidationState;
 getFieldState?: (fieldName: string) => FieldValidationState | undefined;
 isValid?: () => boolean;
 hasErrors?: () => boolean;
};

function modalFeedbackModeIncludesHelper(
 feedbackMode: string | undefined,
): boolean {
 return feedbackMode === "helper" || feedbackMode === "both";
}

type ModalFormContext<T> = {
 close: () => void;
 submit: () => void;
 reset: () => void;
 resetSection: (path: string) => void;
 validate: () => Promise<boolean>;
 clearErrors: () => void;
 getModel: () => T | null;
 setFieldValue: (path: string, value: unknown) => void;
 getFieldValue: <P extends Path<T>>(path: P) => PathValue<T, P> | null;
 isValid: () => boolean;
 hasErrors: () => boolean;
 getValidationState: () => ValidationState;
 getFieldState: (fieldName: string) => FieldValidationState | undefined;
 validationState: ValidationState;
 isValidating: boolean;
};

type ModalFormSubmitContext<T> = ModalFormContext<T> & {
 event: React.SubmitEvent<HTMLFormElement>;
};

export type ModalFormProps<T = Record<string, unknown>> = {
 id: string;
 open?: boolean;
 title?: React.ReactNode;
 description?: React.ReactNode;
 model?: Partial<T>;
 validation?: ValidationConfig<T>;
 size?: ModalSize;
 children: React.ReactNode | ((ctx: ModalFormContext<T>) => React.ReactNode);
 actions?: React.ReactNode | ((ctx: ModalFormContext<T>) => React.ReactNode);
 submitLabel?: React.ReactNode;
 cancelLabel?: React.ReactNode;
 resetLabel?: React.ReactNode;
 showReset?: boolean;
 disableSubmitWhenInvalid?: boolean;
 closeOnEscape?: boolean;
 closeOnBackdropClick?: boolean;
 hideCloseButton?: boolean;
 className?: string;
 formClassName?: string;
 classNames?: ModalClassNames;
 onClose: () => void;
 onSubmit: (model: T, ctx: ModalFormSubmitContext<T>) => void | Promise<void>;
};

const secondaryButtonClassName = [
 "inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition",
 "hover:bg-slate-50 hover:text-slate-950",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
 "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const primaryButtonClassName = [
 "inline-flex h-10 items-center justify-center rounded-lg border border-sky-600 bg-sky-600 px-4 text-sm font-medium text-white shadow-sm transition",
 "hover:bg-sky-700 hover:border-sky-700",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
 "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const ghostButtonClassName = [
 "inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-transparent px-4 text-sm font-medium text-slate-600 transition",
 "hover:bg-slate-100 hover:text-slate-950",
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
 "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

function ModalFormMounted<T = Record<string, unknown>>({
 id,
 title,
 description,
 model,
 validation,
 size = "xl",
 children,
 actions,
 submitLabel = "Salvar",
 cancelLabel = "Cancelar",
 resetLabel = "Restaurar",
 showReset = false,
 disableSubmitWhenInvalid = false,
 closeOnEscape,
 closeOnBackdropClick,
 hideCloseButton,
 className,
 formClassName,
 classNames,
 onClose,
 onSubmit,
}: Omit<ModalFormProps<T>, "open">) {
 const ctxRef = React.useRef<ModalFormContext<T> | null>(null);

 const formApi = useForm<T>({
  id,
  model,
  validation,
  onSubmit: async (submittedModel, event) => {
   const ctx = ctxRef.current;

   if (!ctx) {
    return;
   }

   return await onSubmit(submittedModel, { ...ctx, event });
  },
 });

 const validationCompat = formApi as typeof formApi &
  ModalFormApiValidationCompat;
 const effectiveFeedbackMode =
  validation?.feedbackMode ?? validation?.mode ?? "native";
 const shouldAutoDisableSubmitByInvalidity =
  disableSubmitWhenInvalid &&
  modalFeedbackModeIncludesHelper(effectiveFeedbackMode);

 const getSafeValidationState = React.useCallback((): ValidationState => {
  return (
   validationCompat.getValidationState?.() ??
   validationCompat.validationState ??
   UNKNOWN_VALIDATION_STATE
  );
 }, [validationCompat]);

 const safeIsValid = React.useCallback((): boolean => {
  return validationCompat.isValid?.() ?? getSafeValidationState().valid;
 }, [getSafeValidationState, validationCompat]);

 const safeHasErrors = React.useCallback((): boolean => {
  return validationCompat.hasErrors?.() ?? getSafeValidationState().hasErrors;
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

 const ctx = React.useMemo<ModalFormContext<T>>(
  () => ({
   close: onClose,
   submit: formApi.submit,
   reset: formApi.reset,
   resetSection: (path: string) => {
    validationCompat.resetSection?.(path);
   },
   validate: formApi.validate,
   clearErrors: formApi.clearErrors,
   getModel: formApi.getModel,
   setFieldValue: formApi.setFieldValue,
   getFieldValue: formApi.getFieldValue,
   isValid: safeIsValid,
   hasErrors: safeHasErrors,
   getValidationState: getSafeValidationState,
   getFieldState: safeGetFieldState,
   validationState: getSafeValidationState(),
   isValidating: formApi.isValidating,
  }),
  [
   formApi.clearErrors,
   formApi.getFieldValue,
   formApi.getModel,
   getSafeValidationState,
   safeGetFieldState,
   safeHasErrors,
   safeIsValid,
   formApi.isValidating,
   formApi.reset,
   validationCompat.resetSection,
   formApi.setFieldValue,
   formApi.submit,
   formApi.validate,
   onClose,
  ],
 );

 React.useEffect(() => {
  ctxRef.current = ctx;
 }, [ctx]);

 const shouldDisableSubmit = Boolean(
  formApi.isValidating ||
   (shouldAutoDisableSubmitByInvalidity &&
    getSafeValidationState().known === true &&
    getSafeValidationState().valid === false),
 );

 const defaultActions = (
  <div className="flex flex-wrap items-center justify-end gap-2">
   <button
    type="button"
    className={ghostButtonClassName}
    onClick={onClose}
   >
    {cancelLabel}
   </button>

   {showReset && (
    <button
     type="button"
     className={secondaryButtonClassName}
     onClick={formApi.reset}
    >
     {resetLabel}
    </button>
   )}

   <button
    type="submit"
    className={primaryButtonClassName}
    disabled={shouldDisableSubmit}
   >
    {formApi.isValidating ? "Validando..." : submitLabel}
   </button>
  </div>
 );

 return (
  <Modal
   open
   onClose={onClose}
   title={title}
   description={description}
   size={size}
   hideCloseButton={hideCloseButton}
   closeOnEscape={closeOnEscape}
   closeOnBackdropClick={closeOnBackdropClick}
   classNames={classNames}
  >
   <form
    {...formApi.formProps}
    noValidate={effectiveFeedbackMode !== "native"}
    className={cn("flex min-h-0 flex-col gap-5", className, formClassName)}
   >
    <div className="min-h-0 text-slate-700">
     {typeof children === "function" ? children(ctx) : children}
    </div>

    <div className="-mx-5 -mb-5 mt-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
     {actions
      ? typeof actions === "function"
       ? actions(ctx)
       : actions
      : defaultActions}
    </div>
   </form>
  </Modal>
 );
}

export function ModalForm<T = Record<string, unknown>>({
 open = true,
 ...props
}: ModalFormProps<T>) {
 if (!open) {
  return null;
 }

 return <ModalFormMounted<T> {...props} />;
}

export type { ModalFormContext, ModalFormSubmitContext };
