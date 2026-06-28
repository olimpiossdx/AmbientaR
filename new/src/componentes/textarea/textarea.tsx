import React from 'react';
import { cn } from '../../utils/cn';
import type { TextareaProps } from './propTypes.textarea';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
 ({ label, invalid, fullWidth = true, autoResize, className, containerClassName, id, onInput, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const textareaId = id ?? props.name;

  const setRef = React.useCallback((node: HTMLTextAreaElement | null) => {
   innerRef.current = node;
   if (typeof ref === 'function') ref(node);
   else if (ref) ref.current = node;
  }, [ref]);

  const resize = React.useCallback(() => {
   const element = innerRef.current;
   if (!element || !autoResize) return;
   element.style.height = 'auto';
   element.style.height = `${element.scrollHeight}px`;
  }, [autoResize]);

  React.useLayoutEffect(() => { resize(); }, [resize, props.value, props.defaultValue]);

  return (
   <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
    {label && <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">{label}</label>}
    <textarea
     ref={setRef}
     id={textareaId}
     aria-invalid={invalid || undefined}
     data-invalid={invalid || undefined}
     onInput={(event) => { resize(); onInput?.(event); }}
     className={cn(
      'min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm outline-none transition',
      'placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
      '',
      invalid && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
      fullWidth && 'w-full',
      className,
     )}
     {...props}
    />
   </div>
  );
 },
);

Textarea.displayName = 'Textarea';
