import React from 'react';
import { cn } from '../../utils/cn';
import type { SliderProps } from './propTypes.slider';
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ label, showValue, invalid, containerClassName, className, id, value, defaultValue, onChange, ...props }, ref) => {
 const [internal, setInternal] = React.useState(String(defaultValue ?? props.min ?? 0));
 const current = value !== undefined ? String(value) : internal;
 const inputId = id ?? props.name;
 return <div className={cn('grid gap-1.5', containerClassName)}>{label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}<div className="flex items-center gap-3"><input ref={ref} id={inputId} type="range" value={current} aria-invalid={invalid || undefined} className={cn('w-full accent-blue-600', className)} onChange={(event) => { if (value === undefined) setInternal(event.currentTarget.value); onChange?.(event); }} {...props} />{showValue && <span className="min-w-10 text-right text-sm text-gray-500">{current}</span>}</div></div>;
});
Slider.displayName = 'Slider';
