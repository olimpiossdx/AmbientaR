import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import type { SheetProps } from './sheet.types';

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

export const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(({ open, onOpenChange, side = 'right', children, className, ...props }, ref) => {
  const reactId = React.useId();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const contentId = props.id ?? `sheet-${reactId}`;
  const labelledBy = props['aria-labelledby'];
  const describedBy = props['aria-describedby'];

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

  React.useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    requestAnimationFrame(() => {
      const content = contentRef.current;
      if (!content) return;
      const firstFocusable = getFocusableElements(content)[0];
      (firstFocusable ?? content).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange?.(false);
        return;
      }

      if (event.key !== 'Tab') return;

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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  const sideClass = side === 'left' ? 'left-0 top-0 h-full w-80 max-w-[calc(100vw-2rem)]' : side === 'right' ? 'right-0 top-0 h-full w-80 max-w-[calc(100vw-2rem)]' : side === 'top' ? 'left-0 top-0 max-h-[calc(100vh-2rem)] h-80 w-full' : 'bottom-0 left-0 max-h-[calc(100vh-2rem)] h-80 w-full';

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
      <div
        {...props}
        id={contentId}
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn('absolute overflow-y-auto border border-gray-200 bg-white p-6 shadow-xl outline-none', sideClass, className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
});
Sheet.displayName = 'Sheet';
