import React from 'react';
import { cn } from '../../utils/cn';
import type { MenubarItem, MenubarProps } from './menubar.types';

function MenubarNode({ item, level = 0 }: { item: MenubarItem; level?: number }) {
  const reactId = React.useId();
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const hasChildren = Boolean(item.children?.length);
  const menuId = `${reactId}-submenu`;

  React.useEffect(() => {
    if (!open) return;
    const handleDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        aria-haspopup={hasChildren ? 'menu' : undefined}
        aria-expanded={hasChildren ? open : undefined}
        aria-controls={hasChildren && open ? menuId : undefined}
        className="rounded px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
        onKeyDown={(event) => {
          if (!hasChildren) return;
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus());
          }
        }}
        onClick={() => hasChildren ? setOpen(!open) : item.onSelect?.()}
      >
        {item.label}
      </button>
      {open && item.children && (
        <div ref={menuRef} id={menuId} role="menu" className={cn('absolute z-50 mt-1 min-w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg', level === 0 ? 'left-0 top-full' : 'left-full top-0')}>
          {item.children.map((child, i) => <MenubarNode key={i} item={child} level={level + 1} />)}
        </div>
      )}
    </div>
  );
}
export const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(({ items = [], className, ...props }, ref) => {
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const focusItem = (index: number) => itemRefs.current[index]?.focus();
  return (
    <div
      ref={ref}
      role="menubar"
      className={cn('flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1', className)}
      onKeyDown={(event) => {
        const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          focusItem((activeIndex + 1 + items.length) % items.length);
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          focusItem((activeIndex - 1 + items.length) % items.length);
        }
      }}
      {...props}
    >
      {items.map((item, i) => (
        <div key={i} ref={(node) => { itemRefs.current[i] = node?.querySelector('button') ?? null; }}>
          <MenubarNode item={item} />
        </div>
      ))}
    </div>
  );
});
Menubar.displayName = 'Menubar';
