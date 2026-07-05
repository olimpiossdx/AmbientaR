import React from 'react';
import { cn } from '../../utils/cn';
import type { SelectProps } from './propTypes.select';

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
 ({ label, placeholder, options, invalid, fullWidth = true, containerClassName, className, id, children, ...props }, ref) => {
  const selectId = id ?? props.name;
  return (
   <div className={cn('ui-field-container', fullWidth && 'w-full', containerClassName)}>
    {label && <label htmlFor={selectId} className="ui-field-label">{label}</label>}
    <select
     ref={ref}
     id={selectId}
     aria-invalid={invalid || undefined}
     data-invalid={invalid || undefined}
     className={cn(
      'ui-control h-11 px-3 text-sm',
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
