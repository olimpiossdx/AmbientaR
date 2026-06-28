import React from "react";
import { cn } from "@sglara/cn";

import type { HelperControllerProps, HelperVariant, IHelperTextApi } from "./propTypes";

const variantClasses = {
 info: "text-blue-600",
 warning: "text-yellow-600",
 error: "text-red-600",
 success: "text-green-600",
 neutral: "text-gray-500",
} satisfies Record<HelperVariant, string>;

const HelperText: React.FC<HelperControllerProps> = ({
 id,
 attach,
 initialMessage = null,
 initialStatus = "info",
 className,
}) => {
 const [state, setState] = React.useState<{
  message: React.ReactNode;
  status: HelperVariant;
 }>({
  message: initialMessage,
  status: initialStatus,
 });

 const helperApi = React.useMemo<IHelperTextApi>(() => ({
  setMessage: (message) => {
   setState((current) => ({ ...current, message }));
  },

  setStatus: (status) => {
   setState((current) => ({ ...current, status }));
  },

  set: (message, status) => {
   setState((current) => ({
    message,
    status: status ?? current.status,
   }));
  },

  clear: () => {
   setState((current) => ({ ...current, message: null }));
  },
 }), []);

 React.useEffect(() => {
  attach(helperApi);
 }, [attach, helperApi]);

 if (!state.message) {
  return null;
 }

 return (
  <span
   id={id}
   role={state.status === "error" ? "alert" : "status"}
   aria-live={state.status === "error" ? "assertive" : "polite"}
   data-helper-status={state.status}
   className={cn("text-xs leading-5", variantClasses[state.status], className)}
  >
   {state.message}
  </span>
 );
};

export default HelperText;
