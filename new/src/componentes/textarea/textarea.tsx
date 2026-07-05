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
   <div className={cn('ui-field-container', fullWidth && 'w-full', containerClassName)}>
    {label && <label htmlFor={textareaId} className="ui-field-label">{label}</label>}
    <textarea
     ref={setRef}
     id={textareaId}
     aria-invalid={invalid || undefined}
     data-invalid={invalid || undefined}
     onInput={(event) => { resize(); onInput?.(event); }}
     className={cn(
      'ui-control min-h-24 px-3 py-2 text-sm',
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
