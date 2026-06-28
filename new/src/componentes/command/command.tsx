import React from 'react';
import { cn } from '../../utils/cn';
import type { CommandProps } from './command.types';
import Input from '../input';

export const Command = React.forwardRef<HTMLDivElement, CommandProps>(({ items = [], placeholder = 'Digite para buscar...', emptyMessage = 'Nenhum resultado encontrado.', onValueChange, className, ...props }, ref) => {
  const reactId = React.useId();
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listboxId = `${reactId}-listbox`;
  const normalized = query.trim().toLowerCase();
  const filtered = items.filter((item) => !normalized || [String(item.label), item.value, ...(item.keywords ?? [])].join(' ').toLowerCase().includes(normalized));
  const activeItem = filtered[activeIndex];

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectItem = React.useCallback((item = activeItem) => {
    if (!item || item.disabled) return;
    item.onSelect?.(item.value);
  }, [activeItem]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(filtered.length - 1, current + 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(Math.max(0, filtered.length - 1));
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      selectItem();
    }
  };

  return (
    <div ref={ref} className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm', className)} {...props}>
      <Input
        name="command"
        value={query}
        onChange={(event) => { setQuery(event.target.value); onValueChange?.(event.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-10 w-full border-b border-gray-200 bg-transparent px-3 text-sm outline-none"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded="true"
        aria-controls={listboxId}
        aria-activedescendant={activeItem ? `${reactId}-option-${activeItem.value}` : undefined}
      />
      <div id={listboxId} role="listbox" className="max-h-72 overflow-auto p-1" tabIndex={0} aria-label="Resultados do comando">
        {filtered.length === 0 && <div className="px-3 py-6 text-center text-sm text-gray-500">{emptyMessage}</div>}
        {filtered.map((item, index) => (
          <button
            key={item.value}
            id={`${reactId}-option-${item.value}`}
            type="button"
            role="option"
            aria-selected={activeIndex === index}
            disabled={item.disabled}
            className={cn('flex w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50', activeIndex === index && 'bg-gray-100')}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => selectItem(item)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
});
Command.displayName = 'Command';
