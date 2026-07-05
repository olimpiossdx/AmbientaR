import React from 'react';
import { cn } from '../../utils/cn';
import type { SliderProps } from './propTypes.slider';
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ label, showValue, invalid, containerClassName, className, id, value, defaultValue, onChange, ...props }, ref) => {
 const [internal, setInternal] = React.useState(String(defaultValue ?? props.min ?? 0));
 const current = value !== undefined ? String(value) : internal;
 const inputId = id ?? props.name;
 return <div className={cn('ui-field-container', containerClassName)}>{label && <label htmlFor={inputId} className="ui-field-label">{label}</label>}<div className="flex items-center gap-3"><input ref={ref} id={inputId} type="range" value={current} aria-invalid={invalid || undefined} data-invalid={invalid || undefined} className={cn('w-full accent-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60', className)} onChange={(event) => { if (value === undefined) setInternal(event.currentTarget.value); onChange?.(event); }} {...props} />{showValue && <span className="min-w-10 text-right text-sm text-muted-foreground">{current}</span>}</div></div>;
});
Slider.displayName = 'Slider';
