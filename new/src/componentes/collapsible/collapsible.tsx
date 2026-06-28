import React from 'react';
import { cn } from '../../utils/cn';
import type { CollapsibleProps } from './collapsible.types';
export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(({ open, defaultOpen, onOpenChange, trigger, children, className, ...props }, ref) => {
 const [internal, setInternal] = React.useState(Boolean(defaultOpen));
 const isOpen = open ?? internal;
 const setOpen = (next: boolean) => { if (open === undefined) setInternal(next); onOpenChange?.(next); };
 return <div ref={ref} className={cn('grid gap-2', className)} {...props}>{trigger && <button type="button" aria-expanded={isOpen} onClick={() => setOpen(!isOpen)} className="text-left">{trigger}</button>}{isOpen && <div>{children}</div>}</div>;
});
Collapsible.displayName = 'Collapsible';
