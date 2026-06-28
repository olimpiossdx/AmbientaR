import React from 'react';
import { cn } from '../../utils/cn';
import type { StepperProps } from './stepper.types';
export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(({ steps, index, defaultIndex = 0, onIndexChange, className, ...props }, ref) => {
 const [internal, setInternal] = React.useState(defaultIndex);
 const current = index ?? internal;
 const setCurrent = (next: number) => { const safe = Math.max(0, Math.min(steps.length - 1, next)); if (index === undefined) setInternal(safe); onIndexChange?.(safe); };
 return <div ref={ref} className={cn('grid gap-4', className)} {...props}><ol className="flex flex-wrap gap-3">{steps.map((step, i) => <li key={i} className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', i === current ? 'border-blue-500 bg-blue-50 text-blue-900' : i < current ? 'border-green-500 bg-green-50 text-green-900' : 'border-gray-200')}><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold">{i < current ? '✓' : i + 1}</span><span><span className="font-medium">{step.title}</span>{step.description && <span className="block text-xs opacity-70">{step.description}</span>}</span></li>)}</ol><div className="flex gap-2"><button type="button" onClick={() => setCurrent(current - 1)} disabled={current <= 0} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Anterior</button><button type="button" onClick={() => setCurrent(current + 1)} disabled={current >= steps.length - 1} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Próximo</button></div></div>;
});
Stepper.displayName = 'Stepper';
