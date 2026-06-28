import React from 'react';
import { cn } from '../../utils/cn';
import type { LabelProps } from './propTypes.label';

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
 ({ children, required, optional, className, ...props }, ref) => (
  <label ref={ref} className={cn('text-sm font-medium text-gray-700', className)} {...props}>
   {children}
   {required && <span aria-hidden="true" className="ml-1 text-red-500">*</span>}
   {!required && optional && <span className="ml-1 text-xs font-normal text-gray-500">{optional === true ? '(opcional)' : optional}</span>}
  </label>
 ),
);

Label.displayName = 'Label';
