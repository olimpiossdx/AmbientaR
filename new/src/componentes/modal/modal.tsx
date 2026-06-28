import React from "react";
import { X } from "lucide-react";

import { cn } from "@sglara/cn";
import type {
 IModalOptions,
 IModalProps,
 ModalBaseProps,
 ModalSize,
 ModalSlot,
 ModalSlotProps,
} from "./modal.types";

const MODAL_ANIMATION_MS = 220;
const MODAL_STACK_ATTR = "data-hybrid-modal";

export const ModalHeader = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
  className={cn(
   "flex flex-col gap-1.5 border-b border-slate-200 bg-white px-5 py-4 pr-12",
   className,
  )}
  {...props}
 />
);

export const ModalTitle = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
 <h3
  className={cn(
   "text-lg font-semibold leading-6 tracking-tight text-slate-950",
   className,
  )}
  {...props}
 />
);

export const ModalDescription = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
 <p
  className={cn("text-sm leading-6 text-slate-500", className)}
  {...props}
 />
);

export const ModalContent = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
  className={cn(
   "min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 text-slate-700",
   className,
  )}
  {...props}
 />
);

export const ModalFooter = ({
 className,
 ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
 <div
  className={cn(
   "flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4",
   className,
  )}
  {...props}
 />
);

type NormalizedModalProps = ModalBaseProps & {
 slotProps?: {
  title?: Record<string, unknown>;
  children?: Record<string, unknown>;
  footer?: Record<string, unknown>;
 };
};

function isOptionsProps(
 props: IModalProps,
): props is Extract<IModalProps, { options: IModalOptions<any, any, any> }> {
 return "options" in props;
}

function normalizeModalProps(props: IModalProps): NormalizedModalProps {
 if (!isOptionsProps(props)) {
  return props;
 }

 const { options, onClose, registerCloseAnimation } = props;

 return {
  open: true,
  onClose,
  title: options.title,
  description: options.description,
  children: options.content,
  footer: options.footer ?? options.actions,
  size: options.size,
  hideCloseButton: options.hideCloseButton,
  closeOnEscape: options.closeOnEscape,
  closeOnBackdropClick: options.closeOnBackdropClick,
  classNames: options.classNames,
  styleConfig: options.styleConfig,
  registerCloseAnimation,
  slotProps: {
   title: options.props?.title as Record<string, unknown> | undefined,
   children: options.props?.content as Record<string, unknown> | undefined,
   footer: (options.props?.footer ?? options.props?.actions) as
    | Record<string, unknown>
    | undefined,
  },
 };
}

function renderSlot(
 slot: ModalSlot<any> | undefined,
 injectedProps: ModalSlotProps,
 slotProps?: Record<string, unknown>,
): React.ReactNode {
 if (!slot) {
  return null;
 }

 const finalProps = {
  ...slotProps,
  ...injectedProps,
 };

 if (typeof slot === "function") {
  const SlotComponent = slot as React.ComponentType<typeof finalProps>;
  return <SlotComponent {...finalProps} />;
 }

 if (React.isValidElement(slot)) {
  if (typeof slot.type === "string") {
   return slot;
  }

  return React.cloneElement(
   slot as React.ReactElement<Record<string, unknown>>,
   finalProps,
  );
 }

 return slot;
}

const sizeClasses: Record<ModalSize, string> = {
 sm: "max-w-sm",
 md: "max-w-md",
 lg: "max-w-lg",
 xl: "max-w-xl",
 "2xl": "max-w-2xl",
 "3xl": "max-w-3xl",
 full: "h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]",
 custom: "",
};

const Modal: React.FC<IModalProps> = (props) => {
 const {
  open = true,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideCloseButton = false,
  closeOnEscape = true,
  closeOnBackdropClick = true,
  classNames,
  styleConfig,
  registerCloseAnimation,
  slotProps,
 } = normalizeModalProps(props);

 const [isVisible, setIsVisible] = React.useState(false);
 const [shouldRender, setShouldRender] = React.useState(open);
 const modalRef = React.useRef<HTMLDivElement>(null);
 const overlayRef = React.useRef<HTMLDivElement>(null);
 const previousFocusRef = React.useRef<HTMLElement | null>(null);
 const previousBodyOverflowRef = React.useRef<string>("");
 const closeTimeoutRef = React.useRef<number | null>(null);
 const isClosingRef = React.useRef(false);
 const reactId = React.useId();
 const titleId = title ? `modal-title-${reactId}` : undefined;
 const descriptionId = description ? `modal-description-${reactId}` : undefined;

 React.useEffect(() => {
  if (!open) {
   setIsVisible(false);
   const timeout = window.setTimeout(
    () => setShouldRender(false),
    MODAL_ANIMATION_MS,
   );
   return () => window.clearTimeout(timeout);
  }

  isClosingRef.current = false;
  setShouldRender(true);
  const frame = requestAnimationFrame(() => {
   setIsVisible(true);
   modalRef.current?.focus();
  });

  return () => cancelAnimationFrame(frame);
 }, [open]);

 const handleClose = React.useCallback(() => {
  if (isClosingRef.current) {
   return;
  }

  isClosingRef.current = true;
  setIsVisible(false);

  if (closeTimeoutRef.current !== null) {
   window.clearTimeout(closeTimeoutRef.current);
  }

  closeTimeoutRef.current = window.setTimeout(() => {
   closeTimeoutRef.current = null;
   onClose();
   previousFocusRef.current?.focus();
  }, MODAL_ANIMATION_MS);
 }, [onClose]);

 React.useEffect(() => {
  registerCloseAnimation?.(handleClose);
 }, [handleClose, registerCloseAnimation]);

 React.useEffect(() => {
  return () => {
   if (closeTimeoutRef.current !== null) {
    window.clearTimeout(closeTimeoutRef.current);
   }
  };
 }, []);

 const handleCloseRef = React.useRef(handleClose);
 handleCloseRef.current = handleClose;

 React.useEffect(() => {
  if (!shouldRender) {
   return;
  }

  previousFocusRef.current = document.activeElement as HTMLElement;
  previousBodyOverflowRef.current = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  const handleKeyDown = (event: KeyboardEvent) => {
   const allModals = document.querySelectorAll(
    `[${MODAL_STACK_ATTR}="true"]`,
   );
   const isTopModal =
    allModals.length > 0 &&
    allModals[allModals.length - 1] === overlayRef.current;

   if (!isTopModal) {
    return;
   }

   if (event.key === "Escape") {
    event.stopPropagation();
    if (closeOnEscape) {
     handleCloseRef.current();
    }
    return;
   }

   if (event.key === "Tab" && modalRef.current) {
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
     'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) {
     event.preventDefault();
     return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
     event.preventDefault();
     lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
     event.preventDefault();
     firstElement.focus();
    }
   }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
   window.removeEventListener("keydown", handleKeyDown);

   const otherModals = Array.from(
    document.querySelectorAll(`[${MODAL_STACK_ATTR}="true"]`),
   ).filter((item) => item !== overlayRef.current);

   if (otherModals.length === 0) {
    document.body.style.overflow = previousBodyOverflowRef.current;
   }
  };
 }, [closeOnEscape, shouldRender]);

 const handleBackdropClick = React.useCallback(
  (event: React.MouseEvent<HTMLDivElement>) => {
   if (event.target === overlayRef.current && closeOnBackdropClick) {
    handleCloseRef.current();
   }
  },
  [closeOnBackdropClick],
 );

 if (!shouldRender) {
  return null;
 }

 const injectedProps: ModalSlotProps = {
  close: handleClose,
  onClose: handleClose,
 };

 return (
  <div
   ref={overlayRef}
   data-hybrid-modal="true"
   className={cn(
    "fixed inset-0 z-9999 flex items-center justify-center p-4 transition-all duration-200 sm:p-6",
    isVisible ? "bg-slate-950/45 backdrop-blur-[2px]" : "bg-slate-950/0 backdrop-blur-none",
    classNames?.overlay,
   )}
   onClick={handleBackdropClick}
   aria-modal="true"
   role="dialog"
   aria-labelledby={titleId}
   aria-describedby={descriptionId}
  >
   <div
    ref={modalRef}
    tabIndex={-1}
    className={cn(
     "relative flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl outline-none transition-all duration-200",
     isVisible
      ? "translate-y-0 scale-100 opacity-100"
      : "translate-y-3 scale-[0.98] opacity-0",
     sizeClasses[size],
     classNames?.panel,
    )}
    style={styleConfig}
    onClick={(event) => event.stopPropagation()}
   >
    {!hideCloseButton && (
     <button
      type="button"
      onClick={handleClose}
      className={cn(
       "absolute right-3 top-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-500 transition",
       "hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900",
       "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
       classNames?.closeButton,
      )}
      title="Fechar"
      aria-label="Fechar modal"
     >
      <X size={18} aria-hidden="true" />
     </button>
    )}

    {(title || description) && (
     <ModalHeader className={classNames?.header}>
      {typeof title === "string" ? (
       <ModalTitle id={titleId} className={classNames?.title}>
        {title}
       </ModalTitle>
      ) : (
       renderSlot(title, injectedProps, slotProps?.title)
      )}

      {description && (
       <ModalDescription
        id={descriptionId}
        className={classNames?.description}
       >
        {description}
       </ModalDescription>
      )}
     </ModalHeader>
    )}

    <ModalContent className={classNames?.content}>
     {renderSlot(children, injectedProps, slotProps?.children)}
    </ModalContent>

    {footer && (
     <ModalFooter className={classNames?.footer}>
      {renderSlot(footer, injectedProps, slotProps?.footer)}
     </ModalFooter>
    )}
   </div>
  </div>
 );
};

export default Modal;
