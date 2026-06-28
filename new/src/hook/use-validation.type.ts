import React from "react";

export type ValidationFeedbackMode = "native" | "helper" | "both" | "silent";

export type ValidationResultType = "error" | "warning" | "info" | "success" | "neutral";

export type ValidationResultSource = "native" | "custom";

export type ValidationResult = {
  valid: boolean;
  message?: React.ReactNode;
  type?: ValidationResultType;
};

export type NormalizedValidationResult = {
  valid: boolean;
  message: React.ReactNode;
  type: ValidationResultType;
  source: ValidationResultSource;
};

export type CustomValidationRule<T> = {
  validate: (value: unknown, formData: T, event?: Event) => ValidationResult | Promise<ValidationResult>;
  dependsOn?: string[];
  feedbackMode?: ValidationFeedbackMode;
};

export type ValidationFieldConfig<T> = CustomValidationRule<T> | CustomValidationRule<T>[];

export type ValidationSchema<T> = Record<string, ValidationFieldConfig<T>>;

export type FieldValidationStatus = "idle" | "valid" | "invalid" | "warning" | "info" | "success" | "neutral" | "validating";

export type FieldValidationState = {
  name: string;
  valid: boolean;
  status: FieldValidationStatus;
  message?: React.ReactNode;
  blocking: boolean;
  touched: boolean;
  dirty: boolean;
  source?: ValidationResultSource;
};

export type ValidationState = {
  known: boolean;
  valid: boolean;
  hasErrors: boolean;
  validating: boolean;
  fields: Record<string, FieldValidationState>;
};

export interface ValidationConfig<T = unknown> {
  schema: ValidationSchema<T>;
  feedbackMode?: ValidationFeedbackMode;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounce?: number;
  invalidBlurFocusStrategy?: "never" | "once" | "always";
  focusFirstInvalidOnSubmit?: boolean;

  /**
   * @deprecated Use feedbackMode.
   */
  mode?: "native" | "both";
}

export type ValidateFieldPublicOptions<T = unknown> = {
  event?: Event;
  skipDependents?: boolean;
  externalModel?: T;
  reportNative?: boolean;
  allowInvalidFocus?: boolean;
  markKnown?: boolean;
};

export type ValidateScopeTarget = string | string[] | HTMLElement | HTMLFormElement | null | undefined;

export type ValidateScopeOptions<T = unknown> = {
  event?: Event;
  externalModel?: T;
  reportNative?: boolean;
  markKnown?: boolean;
};

export interface UseValidationReturn<T = unknown> {
  isValidating: boolean;
  validationState: ValidationState;
  validate: () => Promise<boolean>;
  validateField: (fieldName: string, options?: ValidateFieldPublicOptions<T>) => Promise<boolean>;
  validateScope: (scope?: ValidateScopeTarget, options?: ValidateScopeOptions<T>) => Promise<boolean>;
  clearErrors: () => void;
  isValid: () => boolean;
  hasErrors: () => boolean;
  getValidationState: () => ValidationState;
  getFieldState: (fieldName: string) => FieldValidationState | undefined;
}
