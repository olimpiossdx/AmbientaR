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
    "data-[invalid]:border-red-500 data-[invalid]:text-red-600 data-[invalid]:focus:border-red-500 data-[invalid]:focus:ring-red-500/30 data-[validation-status=error]:border-red-500 data-[validation-status=error]:text-red-600 data-[validation-status=error]:focus:border-red-500 data-[validation-status=error]:focus:ring-red-500/30",
  warning:
    "data-[validation-status=warning]:border-yellow-500 data-[validation-status=warning]:focus:border-yellow-500 data-[validation-status=warning]:focus:ring-yellow-500/30",
  info:
    "data-[validation-status=info]:border-blue-500 data-[validation-status=info]:focus:border-blue-500 data-[validation-status=info]:focus:ring-blue-500/30",
  success:
    "data-[validation-status=success]:border-green-500 data-[validation-status=success]:focus:border-green-500 data-[validation-status=success]:focus:ring-green-500/30",
  neutral:
    "data-[validation-status=neutral]:border-gray-300 dark:data-[validation-status=neutral]:border-gray-600",
} as const;

export const FLOATING_LABEL_ACTIVE_STYLES: Record<NonNullable<IInputProps["variant"]>, string> = {
  filled:
    "peer-focus:top-1 peer-focus:translate-y-0 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75",
  ghost:
    "peer-focus:top-1 peer-focus:translate-y-0 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75",
  outlined:
    "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-75 peer-focus:bg-white peer-focus:px-1 dark:peer-focus:bg-gray-800 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:bg-white peer-[:not(:placeholder-shown)]:px-1 dark:peer-[:not(:placeholder-shown)]:bg-gray-800",
};
