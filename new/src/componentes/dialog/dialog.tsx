import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import type { DialogContentProps, DialogProps } from './dialog.types';

type DialogContextValue = { open: boolean; setOpen: (open: boolean) => void; modal: boolean };
const DialogContext = React.createContext<DialogContextValue | null>(null);
const DialogContentContext = React.createContext<{ titleId: string; descriptionId: string } | null>(null);

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function Dialog({ open, defaultOpen, onOpenChange, modal = true, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(Boolean(defaultOpen));
  const isOpen = open ?? internalOpen;
  const setOpen = React.useCallback((next: boolean) => { if (open === undefined) setInternalOpen(next); onOpenChange?.(next); }, [open, onOpenChange]);
  return <DialogContext.Provider value={{ open: isOpen, setOpen, modal }}>{children}</DialogContext.Provider>;
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ onClick, ...props }, ref) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('DialogTrigger must be used inside Dialog');
  return <button ref={ref} type="button" aria-haspopup="dialog" aria-expanded={ctx.open} onClick={(event) => { onClick?.(event); ctx.setOpen(true); }} {...props} />;
});
DialogTrigger.displayName = 'DialogTrigger';

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(({ className, children, onClose, closeLabel = 'Fechar', ...props }, ref) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('DialogContent must be used inside Dialog');

  const reactId = React.useId();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const contentId = props.id ?? `dialog-${reactId}`;
  const titleId = props['aria-labelledby'] ?? `${contentId}-title`;
  const descriptionId = props['aria-describedby'] ?? `${contentId}-description`;

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

  const close = React.useCallback(() => {
    onClose?.();
    ctx.setOpen(false);
  }, [ctx, onClose]);

  React.useEffect(() => {
    if (!ctx.open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    requestAnimationFrame(() => {
      const content = contentRef.current;
      if (!content) return;
      const firstFocusable = getFocusableElements(content)[0];
      (firstFocusable ?? content).focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== 'Tab' || !ctx.modal) return;

      const content = contentRef.current;
      if (!content) return;
      const focusable = getFocusableElements(content);
      if (focusable.length === 0) {
        event.preventDefault();
        content.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [close, ctx.modal, ctx.open]);

  if (!ctx.open) return null;

  const content = (
    <DialogContentContext.Provider value={{ titleId, descriptionId }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!ctx.modal) close(); }} />
      <div
        {...props}
        id={contentId}
        ref={contentRef}
        role="dialog"
        aria-modal={ctx.modal}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn('relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl outline-none', className)}
      >
        {children}
        <button type="button" aria-label={closeLabel} className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500" onClick={close}>×</button>
      </div>
    </div>
    </DialogContentContext.Provider>
  );

  return createPortal(content, document.body);
});
DialogContent.displayName = 'DialogContent';
export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('mb-4 grid gap-1.5', className)} {...props} />);
export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, id, ...props }, ref) => {
  const contentCtx = React.useContext(DialogContentContext);
  return <h2 ref={ref} id={id ?? contentCtx?.titleId} className={cn('text-lg font-semibold text-gray-950', className)} {...props} />;
});
export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, id, ...props }, ref) => {
  const contentCtx = React.useContext(DialogContentContext);
  return <p ref={ref} id={id ?? contentCtx?.descriptionId} className={cn('text-sm text-gray-500', className)} {...props} />;
});
export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn('mt-6 flex justify-end gap-2', className)} {...props} />);
DialogHeader.displayName = 'DialogHeader'; DialogTitle.displayName = 'DialogTitle'; DialogDescription.displayName = 'DialogDescription'; DialogFooter.displayName = 'DialogFooter';
