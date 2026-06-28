import React from 'react';
import { cn } from '../../utils/cn';
import type { DropdownMenuProps } from './dropdown-menu.types';

export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(({ trigger, items = [], children, className, ...props }, ref) => {
  const reactId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = `${reactId}-menu`;

  React.useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => itemRefs.current.find((item) => item && !item.disabled)?.focus());
  }, [open]);

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const moveFocus = React.useCallback((nextIndex: number) => {
    if (!items.length) return;
    let index = nextIndex;
    for (let attempts = 0; attempts < items.length; attempts += 1) {
      index = (index + items.length) % items.length;
      const item = items[index];
      if (item && !item.disabled) {
        setActiveIndex(index);
        itemRefs.current[index]?.focus();
        return;
      }
      index += nextIndex >= activeIndex ? 1 : -1;
    }
  }, [activeIndex, items]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(activeIndex + 1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(activeIndex - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      moveFocus(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      moveFocus(items.length - 1);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen(!open)}>
        {trigger}
      </button>
      {open && (
        <div id={menuId} ref={ref} role="menu" className={cn('absolute right-0 z-50 mt-2 min-w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg', className)} onKeyDown={handleMenuKeyDown} {...props}>
          {items.map((item, index) => (
            <button
              key={index}
              ref={(node) => { itemRefs.current[index] = node; }}
              type="button"
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              disabled={item.disabled}
              className={cn('flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100 disabled:opacity-50', item.destructive && 'text-red-600')}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => { item.onSelect?.(); close(); }}
            >
              {item.label}
            </button>
          ))}
          {children}
        </div>
      )}
    </div>
  );
});
DropdownMenu.displayName = 'DropdownMenu';
