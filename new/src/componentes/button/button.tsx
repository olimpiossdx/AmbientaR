import React from "react";
import { cn } from "@sglara/cn";
import { Spinner } from "../spinner/spinner";
import { MANAGED_BUTTON_ACTION_API, type IButtonElementWithManagedActionAPI, type IButtonProps, type IManagedActionAPI } from "./propTypes.button";
import { createInstanceId } from "../../utils/object";

const variants = {
 primary:
  "bg-primary !text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent",

 "primary-soft":
  "bg-primary/10 !text-primary hover:bg-primary/15 hover:!text-primary shadow-sm border border-primary/15",

 secondary:
  "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",

 outline:
  "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground",

 ghost:
  "hover:bg-accent hover:text-accent-foreground text-muted-foreground",

 destructive:
  "bg-destructive !text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent",

 link:
  "text-primary underline-offset-4 hover:underline shadow-none border-transparent h-auto px-0",
} satisfies Record<NonNullable<IButtonProps["variant"]>, string>;

const sizes = {
 sm: "h-8 px-3 text-xs rounded-md",
 md: "h-10 px-4 py-2 text-sm",
 lg: "h-11 px-6 text-base",
 icon: "h-10 w-10 p-0",
} satisfies Record<NonNullable<IButtonProps["size"]>, string>;

const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(({
 children, className, isLoading, disabled, leftIcon, rightIcon,
 variant = "primary", size = "md", fullWidth = false, type = "button",
 onClick, ...props
}, ref) => {
 const internalRef = React.useRef<HTMLButtonElement>(null);
 const instanceIdRef = React.useRef(createInstanceId());
 const isMountedRef = React.useRef(false);

 /**
  * Estado aplicado por containers externos:
  * Form, Modal, Toolbar, Stepper, etc.
  *
  * Separado do estado declarativo das props para evitar conflito.
  */
 const [managedLoading, setManagedLoading] = React.useState(false);
 const [managedDisabled, setManagedDisabled] = React.useState(false);

 /**
  * Refs espelhadas para a API via Symbol conseguir ler o estado atual
  * sem depender de closure antiga.
  */
 const managedLoadingRef = React.useRef(managedLoading);
 const managedDisabledRef = React.useRef(managedDisabled);

 React.useLayoutEffect(() => {
  managedLoadingRef.current = managedLoading;
  managedDisabledRef.current = managedDisabled;
 }, [managedLoading, managedDisabled]);

 React.useEffect(() => {
  isMountedRef.current = true;

  return () => {
   isMountedRef.current = false;
  };
 }, []);

 /**
  * Ref pública normal.
  *
  * Sem useImperativeHandle:
  * quem usar ref recebe o HTMLButtonElement real.
  */
 const setRefs = React.useCallback((node: HTMLButtonElement | null) => {
  internalRef.current = node;

  if (typeof ref === "function") {
   ref(node);
   return;
  }

  if (ref) {
   ref.current = node;
  }
 }, [ref]);

 /**
  * Precedência:
  *
  * isLoading prop controla loading quando definida.
  * disabled prop sempre vence.
  * loading efetivo também desabilita o botão.
  */
 const effectiveLoading = isLoading !== undefined ? Boolean(isLoading) : managedLoading;

 const effectiveDisabled = Boolean(disabled) || managedDisabled || effectiveLoading;

 const getCurrentState = React.useCallback(() => {
  const currentLoading = isLoading !== undefined
   ? Boolean(isLoading)
   : managedLoadingRef.current;

  return {
   loading: currentLoading,
   disabled: Boolean(disabled) || managedDisabledRef.current || currentLoading,
  };
 }, [disabled, isLoading]);

 /**
  * Registro DOM-first.
  *
  * Todo Button registra a API, independentemente do type.
  * O container decide a regra:
  * - Form: submitter loading, demais disabled
  * - Modal: ação principal loading, demais disabled
  * - Toolbar: ação clicada loading, demais disabled
  */
 React.useEffect(() => {
  const element = internalRef.current;

  if (!element) {
   return;
  }

  const api: IManagedActionAPI = {
   setLoading: (value) => {
    setManagedLoading(Boolean(value));
   },

   setDisabled: (value) => {
    setManagedDisabled(Boolean(value));
   },

   getState: () => getCurrentState(),

   instanceId: instanceIdRef.current,

   get isMounted() {
    return isMountedRef.current;
   },
  };

  const buttonElement = element as IButtonElementWithManagedActionAPI;
  buttonElement[MANAGED_BUTTON_ACTION_API] = api;

  element.dispatchEvent(new CustomEvent("managed-action:registered", {
   bubbles: true, detail: { instanceId: instanceIdRef.current, }
  }));

  return () => {
   const currentApi = buttonElement[MANAGED_BUTTON_ACTION_API];

   if (currentApi?.instanceId === instanceIdRef.current) {
    delete buttonElement[MANAGED_BUTTON_ACTION_API];
   }
  };
 }, [getCurrentState]);

 const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
  if (effectiveDisabled) {
   event.preventDefault();
   event.stopPropagation();
   return;
  }

  onClick?.(event);
 }, [effectiveDisabled, onClick]);

 const stateStyles = effectiveDisabled
  ? effectiveLoading
   ? "cursor-wait opacity-80"
   : "cursor-not-allowed opacity-50"
  : "cursor-pointer opacity-100 hover:-translate-y-px";

 const finalClassName = cn("inline-flex items-center justify-center rounded-md font-medium gap-2",
  "transition-all duration-200 ease-out",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  "focus-visible:ring-ring/30 focus-visible:ring-offset-background",
  "select-none",
  stateStyles,
  variants[variant],
  sizes[size],
  fullWidth && "w-full",
  className);

 const isIconOnly = size === "icon";

 return (<button
  {...props}
  ref={setRefs}
  type={type}
  className={finalClassName}
  disabled={effectiveDisabled}
  aria-busy={effectiveLoading || undefined}
  data-loading={effectiveLoading ? "true" : undefined}
  data-disabled={effectiveDisabled ? "true" : undefined}
  data-managed-action=""
  onClick={handleClick}>
  {effectiveLoading
   ? (<>
    <Spinner
     size={size === "sm" ? "sm" : "md"}
     className="animate-spin shrink-0"
     aria-hidden="true"
    />

    {!isIconOnly && children
     ? (<span className="inline-flex items-center">{children}</span>)
     : null
    }
   </>)
   : (<>
    {leftIcon
     ? (<span className="flex items-center shrink-0" aria-hidden="true"> {leftIcon} </span>)
     : null
    }

    {!isIconOnly ? children : children}

    {rightIcon
     ? (<span className="flex items-center shrink-0" aria-hidden="true"> {rightIcon} </span>)
     : null
    }
   </>)}
 </button>);
});

Button.displayName = "Button";

export { Button };
