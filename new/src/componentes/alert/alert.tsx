import React from "react";
import {
 AlertCircle,
 AlertTriangle,
 CheckCircle,
 Info,
 X,
} from "lucide-react";

import { cn } from "@sglara/cn";
import type { AlertVariant, IAlertProps } from "./propTypes.alert";

const variants = {
 info: {
  container:
   "bg-primary/10 border-primary/20 text-foreground",
  icon: "text-primary",
  close:
   "hover:bg-primary/15 focus-visible:ring-ring/30",
  DefaultIcon: Info,
 },

 success: {
  container:
   "bg-emerald-50 border-emerald-200 text-emerald-800",
  icon: "text-emerald-500",
  close:
   "hover:bg-emerald-100 focus-visible:ring-emerald-500/30",
  DefaultIcon: CheckCircle,
 },

 warning: {
  container:
   "bg-amber-50 border-amber-200 text-amber-800",
  icon: "text-amber-500",
  close:
   "hover:bg-amber-100 focus-visible:ring-amber-500/30",
  DefaultIcon: AlertTriangle,
 },

 error: {
  container:
   "bg-destructive/10 border-destructive/20 text-destructive",
  icon: "text-destructive",
  close:
   "hover:bg-destructive/15 focus-visible:ring-destructive/30",
  DefaultIcon: AlertCircle,
 },

 neutral: {
  container:
   "bg-muted border-border text-foreground",
  icon: "text-muted-foreground",
  close:
   "hover:bg-accent focus-visible:ring-ring/30",
  DefaultIcon: Info,
 },
} satisfies Record<
 AlertVariant,
 {
  container: string;
  icon: string;
  close: string;
  DefaultIcon: React.ComponentType<{ size?: number; className?: string }>;
 }
>;

const roleByVariant = {
 error: "alert",
 warning: "alert",
 info: "status",
 success: "status",
 neutral: "status",
} satisfies Record<AlertVariant, "alert" | "status">;

const liveByVariant = {
 error: "assertive",
 warning: "polite",
 info: "polite",
 success: "polite",
 neutral: "polite",
} satisfies Record<AlertVariant, "assertive" | "polite">;

/**
 * Alert contextual.
 *
 * Use para mensagens fixas dentro da tela:
 * validações, avisos de seção, feedback pós-ação ou estados informativos.
 */
const Alert = React.memo(
 React.forwardRef<HTMLDivElement, IAlertProps>(
  (
   {
    variant = "neutral",
    title,
    children,
    icon,
    onClose,
    closeLabel = "Fechar alerta",
    className,
    ...props
   },
   ref,
  ) => {
   const style = variants[variant];
   const DefaultIcon = style.DefaultIcon;
   const shouldRenderIcon = icon !== false;

   return (
    <div
     ref={ref}
     role={roleByVariant[variant]}
     aria-live={liveByVariant[variant]}
     className={cn(
      "flex w-full items-start gap-3 rounded-lg border border-l-4 p-4 shadow-sm",
      "animate-in fade-in slide-in-from-top-2 duration-300",
      style.container,
      className,
     )}
     {...props}
    >
     {shouldRenderIcon && (
      <div className={cn("mt-0.5 shrink-0", style.icon)}>
       {icon ?? <DefaultIcon size={20} aria-hidden="true" />}
      </div>
     )}

     <div className="min-w-0 flex-1">
      {title && (
       <div className="mb-1 font-semibold leading-tight">
        {title}
       </div>
      )}

      {children && (
       <div className="text-sm leading-relaxed">
        {children}
       </div>
      )}
     </div>

     {onClose && (
      <button
       type="button"
       onClick={onClose}
       aria-label={closeLabel}
       className={cn(
        "-mr-1 -mt-1 inline-flex shrink-0 items-center justify-center rounded-md p-1.5 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        style.icon,
        style.close,
       )}
      >
       <X size={16} aria-hidden="true" />
      </button>
     )}
    </div>
   );
  },
 ),
);

Alert.displayName = "Alert";

export default Alert;
