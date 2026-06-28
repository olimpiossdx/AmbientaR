import React from 'react';
import { cn } from '../../utils/cn';
import type { AccordionProps } from './accordion.types';
function asArray(value?: string | string[]) { return Array.isArray(value) ? value : value ? [value] : []; }
export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(({ items = [], type = 'single', defaultValue, value, onValueChange, className, ...props }, ref) => {
 const [internal, setInternal] = React.useState<string[]>(asArray(defaultValue));
 const current = value !== undefined ? asArray(value) : internal;
 const setNext = (next: string[]) => { if (value === undefined) setInternal(next); onValueChange?.(type === 'single' ? next[0] ?? '' : next); };
 const toggle = (itemValue: string) => setNext(type === 'single' ? (current.includes(itemValue) ? [] : [itemValue]) : (current.includes(itemValue) ? current.filter(v => v !== itemValue) : [...current, itemValue]));
 return <div ref={ref} className={cn('divide-y divide-gray-200 rounded-md border border-gray-200', className)} {...props}>{items.map(item => { const open = current.includes(item.value); return <div key={item.value}><button type="button" disabled={item.disabled} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium disabled:opacity-60" onClick={() => toggle(item.value)}><span>{item.title}</span><span aria-hidden>{open ? '−' : '+'}</span></button>{open && <div className="px-4 pb-4 text-sm text-gray-600">{item.content}</div>}</div>; })}</div>;
});
Accordion.displayName = 'Accordion';
