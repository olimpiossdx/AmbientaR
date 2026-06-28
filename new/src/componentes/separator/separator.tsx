import React from 'react';
import { cn } from '../../utils/cn';
import type { SeparatorProps } from './propTypes.separator';
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(({ orientation = 'horizontal', decorative = true, className, ...props }, ref) => <div ref={ref} role={decorative ? 'none' : 'separator'} aria-orientation={decorative ? undefined : orientation} className={cn('shrink-0 bg-gray-200', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} {...props} />);
Separator.displayName = 'Separator';
