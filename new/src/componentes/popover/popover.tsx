import React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils/cn';
import type { PopoverProps } from './popover.types';

type PopoverCoords = {
  top: number;
  left: number;
  minWidth?: number;
};

function getAlignLeft(anchorRect: DOMRect, popoverWidth: number, align: NonNullable<PopoverProps['align']>) {
  if (align === 'end') {
    return anchorRect.right - popoverWidth;
  }

  if (align === 'center') {
    return anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
  }

  return anchorRect.left;
}

/**
 * Popover compatível com a API atual do Storybook e com a API ancorada por ref.
 *
 * Importante: a aparência base foi preservada da versão original:
 * absolute z-50 mt-2 min-w-48 rounded-md border border-gray-200 bg-white p-3 shadow-lg.
 * As novas funcionalidades alteram apenas comportamento/posicionamento, não o tema base.
 */
export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      trigger,
      triggerRef,
      open,
      defaultOpen,
      onOpenChange,
      isOpen,
      onClose,
      align = 'start',
      side = 'bottom',
      sideOffset = 8,
      portal = false,
      fullWidth = false,
      closeOnOutsideClick = true,
      triggerClassName,
      children,
      className,
      style,
      ...props
    },
    forwardedRef,
  ) => {
    const reactId = React.useId();
    const popoverId = props.id ?? `popover-${reactId}`;
    const [internalOpen, setInternalOpen] = React.useState(Boolean(defaultOpen));
    const [coords, setCoords] = React.useState<PopoverCoords | null>(null);

    const rootRef = React.useRef<HTMLDivElement>(null);
    const internalTriggerRef = React.useRef<HTMLButtonElement>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(forwardedRef, () => popoverRef.current as HTMLDivElement);

    const resolvedOpen = open ?? isOpen ?? internalOpen;
    const isControlled = open !== undefined || isOpen !== undefined;

    const getAnchor = React.useCallback((): HTMLElement | null => {
      return (triggerRef?.current as HTMLElement | null | undefined) ?? internalTriggerRef.current;
    }, [triggerRef]);

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setInternalOpen(next);
        }

        onOpenChange?.(next);

        if (!next) {
          onClose?.();
        }
      },
      [isControlled, onClose, onOpenChange],
    );

    const updatePosition = React.useCallback(() => {
      if (!portal || !resolvedOpen) {
        return;
      }

      const anchor = getAnchor();
      const popover = popoverRef.current;

      if (!anchor || !popover) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      const popoverWidth = popoverRect.width;
      const popoverHeight = popoverRect.height;

      let nextSide = side;
      const spaceBelow = viewportHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      if (side === 'bottom' && spaceBelow < popoverHeight + sideOffset && spaceAbove > popoverHeight + sideOffset) {
        nextSide = 'top';
      }

      if (side === 'top' && spaceAbove < popoverHeight + sideOffset && spaceBelow > popoverHeight + sideOffset) {
        nextSide = 'bottom';
      }

      const top = nextSide === 'bottom'
        ? anchorRect.bottom + scrollY + sideOffset
        : anchorRect.top + scrollY - popoverHeight - sideOffset;

      let left = getAlignLeft(anchorRect, popoverWidth, align) + scrollX;
      const maxLeft = scrollX + viewportWidth - popoverWidth - 4;
      const minLeft = scrollX + 4;

      if (left > maxLeft) {
        left = maxLeft;
      }

      if (left < minLeft) {
        left = minLeft;
      }

      setCoords({
        top,
        left,
        minWidth: fullWidth ? anchorRect.width : undefined,
      });
    }, [align, fullWidth, getAnchor, portal, resolvedOpen, side, sideOffset]);

    React.useLayoutEffect(() => {
      if (!resolvedOpen) {
        setCoords(null);
        return;
      }

      if (portal) {
        updatePosition();
      }
    }, [portal, resolvedOpen, updatePosition]);

    React.useEffect(() => {
      if (!resolvedOpen || !portal) {
        return;
      }

      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, { capture: true });

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, { capture: true });
      };
    }, [portal, resolvedOpen, updatePosition]);

    React.useEffect(() => {
      if (!resolvedOpen) {
        return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          getAnchor()?.focus();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [getAnchor, resolvedOpen, setOpen]);

    React.useEffect(() => {
      if (!resolvedOpen || !closeOnOutsideClick) {
        return;
      }

      const handleMouseDown = (event: MouseEvent) => {
        const target = event.target as Node;
        const anchor = getAnchor();
        const popover = popoverRef.current;

        if (anchor?.contains(target) || popover?.contains(target) || rootRef.current?.contains(target)) {
          return;
        }

        setOpen(false);
      };

      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [closeOnOutsideClick, getAnchor, resolvedOpen, setOpen]);

    const baseClassName = 'absolute z-50 mt-2 min-w-48 rounded-md border border-gray-200 bg-white p-3 shadow-lg';

    const popoverClassName = cn(
      baseClassName,
      !portal && align === 'end' && 'right-0',
      !portal && align === 'center' && 'left-1/2 -translate-x-1/2',
      className,
    );

    const popoverStyle: React.CSSProperties = portal
      ? {
          ...style,
          top: coords?.top ?? 0,
          left: coords?.left ?? 0,
          minWidth: coords?.minWidth,
          visibility: coords ? 'visible' : 'hidden',
          marginTop: 0,
        }
      : style ?? {};

    const popoverNode = resolvedOpen ? (
      <div ref={popoverRef} id={popoverId} role="dialog" className={popoverClassName} style={popoverStyle} {...props}>
        {children}
      </div>
    ) : null;

    if (!trigger) {
      return portal && popoverNode ? createPortal(popoverNode, document.body) : popoverNode;
    }

    return (
      <div ref={rootRef} className="relative inline-block">
        <button
          ref={internalTriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={resolvedOpen}
          aria-controls={resolvedOpen ? popoverId : undefined}
          onClick={() => setOpen(!resolvedOpen)}
          className={triggerClassName}
        >
          {trigger}
        </button>

        {portal && popoverNode ? createPortal(popoverNode, document.body) : popoverNode}
      </div>
    );
  },
);

Popover.displayName = 'Popover';

export default Popover;
