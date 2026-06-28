import React from 'react';
import { cn } from '../../utils/cn';
import type { TabsProps } from './tabs.types';

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ items = [], value, defaultValue, onValueChange, className, ...props }, ref) => {
  const reactId = React.useId();
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.value ?? '');
  const current = value ?? internal;
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === current));
  const active = items[activeIndex];
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const setCurrent = React.useCallback((next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }, [onValueChange, value]);

  const focusTab = React.useCallback((nextIndex: number) => {
    if (!items.length) return;

    let index = nextIndex;
    for (let attempts = 0; attempts < items.length; attempts += 1) {
      index = (index + items.length) % items.length;
      if (!items[index]?.disabled) {
        setCurrent(items[index].value);
        tabRefs.current[index]?.focus();
        return;
      }
      index += nextIndex >= activeIndex ? 1 : -1;
    }
  }, [activeIndex, items, setCurrent]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusTab(activeIndex + 1);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusTab(activeIndex - 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusTab(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  };

  return (
    <div ref={ref} className={cn('grid gap-3', className)} {...props}>
      <div role="tablist" className="inline-flex rounded-md bg-gray-100 p-1" onKeyDown={handleKeyDown}>
        {items.map((item, index) => {
          const tabId = `${reactId}-${item.value}-tab`;
          const panelId = `${reactId}-${item.value}-panel`;
          const selected = current === item.value;

          return (
            <button
              key={item.value}
              ref={(node) => { tabRefs.current[index] = node; }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className={cn('rounded px-3 py-1.5 text-sm font-medium transition disabled:opacity-50', selected ? 'bg-white shadow-sm' : 'text-gray-600')}
              onClick={() => setCurrent(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div id={`${reactId}-${active.value}-panel`} role="tabpanel" aria-labelledby={`${reactId}-${active.value}-tab`} tabIndex={0}>
          {active.content}
        </div>
      )}
    </div>
  );
});
Tabs.displayName = 'Tabs';
