import React from 'react';
import { cn } from '../../utils/cn';
import type { RadioGroupItemProps, RadioGroupProps } from './radio-group.types';

type RadioGroupContextValue = Pick<RadioGroupProps, 'name' | 'value' | 'defaultValue' | 'invalid' | 'onValueChange'>;
const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
 ({ name, value, defaultValue, invalid, onValueChange, className, children, ...props }, ref) => (
  <RadioGroupContext.Provider value={{ name, value, defaultValue, invalid, onValueChange }}>
   <div ref={ref} role="radiogroup" aria-invalid={invalid || undefined} className={cn('grid gap-2', className)} {...props}>
    {children}
   </div>
  </RadioGroupContext.Provider>
 ),
);
RadioGroup.displayName = 'RadioGroup';

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
 ({ value, label, description, className, id, onChange, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext);
  if (!context) throw new Error('RadioGroupItem must be used inside RadioGroup');
  const inputId = id ?? `${context.name}-${value}`;
  const checked = context.value !== undefined ? context.value === value : undefined;
  const defaultChecked = context.value === undefined ? context.defaultValue === value : undefined;

  return (
   <label htmlFor={inputId} className={cn('flex cursor-pointer items-start gap-2 rounded-md p-1 text-sm text-gray-700', props.disabled && 'cursor-not-allowed opacity-60', className)}>
    <input
     ref={ref}
     id={inputId}
     name={context.name}
     type="radio"
     value={value}
     checked={checked}
     defaultChecked={defaultChecked}
     aria-invalid={context.invalid || undefined}
     className="mt-0.5 h-4 w-4 accent-blue-600"
     onChange={(event) => { onChange?.(event); if (event.currentTarget.checked) context.onValueChange?.(value); }}
     {...props}
    />
    <span className="grid gap-0.5">
     {label && <span className="font-medium">{label}</span>}
     {description && <span className="text-xs text-gray-500">{description}</span>}
    </span>
   </label>
  );
 },
);
RadioGroupItem.displayName = 'RadioGroupItem';
