import React from 'react';
import { cn } from '../../utils/cn';
import type { ResizableProps } from './resizable.types';
export const Resizable = React.forwardRef<HTMLDivElement, ResizableProps>(({ direction = 'both', minWidth, minHeight, className, style, ...props }, ref) => <div ref={ref} style={{ resize: direction, minWidth, minHeight, ...style }} className={cn('overflow-auto rounded-md border border-gray-200', className)} {...props} />);
Resizable.displayName = 'Resizable';
