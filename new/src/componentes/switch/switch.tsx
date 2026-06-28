import React from 'react';
import { cn } from '../../utils/cn';
import type { SwitchProps } from './propTypes.switch';

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
 ({ label, description, invalid, className, id, ...props }, ref) => {
  const switchId = id ?? props.name;
  return (
   <label htmlFor={switchId} className={cn('inline-flex cursor-pointer items-center gap-3 text-sm text-gray-700', props.disabled && 'cursor-not-allowed opacity-60')}>
    <input ref={ref} id={switchId} type="checkbox" role="switch" aria-invalid={invalid || undefined} className="peer sr-only" {...props} />
    <span className={cn('h-6 w-11 rounded-full bg-gray-300 p-0.5 transition before:block before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow before:transition peer-checked:bg-blue-600 peer-checked:before:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-disabled:opacity-60', invalid && 'bg-red-300 peer-checked:bg-red-600', className)} />
    {(label || description) && <span className="grid gap-0.5"><span className="font-medium">{label}</span>{description && <span className="text-xs text-gray-500">{description}</span>}</span>}
   </label>
  );
 },
);
Switch.displayName = 'Switch';
