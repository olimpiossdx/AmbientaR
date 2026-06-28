import React from 'react';
import { cn } from '../../utils/cn';
import type { SelectProps } from './propTypes.select';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
 ({ label, placeholder, options, invalid, fullWidth = true, containerClassName, className, id, children, ...props }, ref) => {
  const selectId = id ?? props.name;
  return (
   <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
    {label && <label htmlFor={selectId} className="text-sm font-medium text-gray-700">{label}</label>}
    <select
     ref={ref}
     id={selectId}
     aria-invalid={invalid || undefined}
     data-invalid={invalid || undefined}
     className={cn(
      'h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-950 shadow-sm outline-none transition',
      'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100',
      '',
      invalid && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      fullWidth && 'w-full',
      className,
     )}
     {...props}
    >
     {placeholder && <option value="" disabled hidden>{placeholder}</option>}
     {options?.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
     {children}
    </select>
   </div>
  );
 },
);
Select.displayName = 'Select';
