import React from 'react';
import { cn } from '../../utils/cn';
import type { ScrollAreaProps } from './scroll-area.types';
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(({ orientation = 'vertical', className, ...props }, ref) => <div ref={ref} className={cn('relative', orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden', orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden', orientation === 'both' && 'overflow-auto', className)} {...props} />);
ScrollArea.displayName = 'ScrollArea';
