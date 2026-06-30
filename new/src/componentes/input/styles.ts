import type { IInputProps } from "./propTypes.input";

export const VARIANT_CLASSES: Record<NonNullable<IInputProps["variant"]>, string> = {
  outlined: "ui-input--outlined",
  filled: "ui-input--filled",
  ghost: "ui-input--ghost",
};

export const SIZE_CLASSES: Record<NonNullable<IInputProps["sized"]>, string> = {
  sm: "ui-input--sm",
  md: "ui-input--md",
  lg: "ui-input--lg",
};

export const STATUS_CLASSES = {
  error:
    "data-[invalid]:border-destructive data-[invalid]:text-destructive data-[invalid]:focus:border-destructive data-[invalid]:focus:ring-destructive/30 data-[validation-status=error]:border-destructive data-[validation-status=error]:text-destructive data-[validation-status=error]:focus:border-destructive data-[validation-status=error]:focus:ring-destructive/30",
  warning:
    "data-[validation-status=warning]:border-amber-500 data-[validation-status=warning]:focus:border-amber-500 data-[validation-status=warning]:focus:ring-amber-500/30",
  info:
    "data-[validation-status=info]:border-ring data-[validation-status=info]:focus:border-ring data-[validation-status=info]:focus:ring-ring/30",
  success:
    "data-[validation-status=success]:border-emerald-500 data-[validation-status=success]:focus:border-emerald-500 data-[validation-status=success]:focus:ring-emerald-500/30",
  neutral:
    "data-[validation-status=neutral]:border-input",
} as const;

export const FLOATING_LABEL_ACTIVE_STYLES: Record<NonNullable<IInputProps["variant"]>, string> = {
  filled:
    "peer-focus:top-1 peer-focus:translate-y-0 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75",
  ghost:
    "peer-focus:top-1 peer-focus:translate-y-0 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75",
  outlined:
    "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-focus:bg-background peer-focus:px-1 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:bg-background peer-[:not(:placeholder-shown)]:px-1",
};
