import React from 'react';
import { cn } from '../../utils/cn';
import type { BadgeProps, BadgeVariant } from './propTypes.badge';
const variants: Record<BadgeVariant, string> = { default: 'bg-blue-600 text-white', secondary: 'bg-gray-100 text-gray-900', success: 'bg-green-100 text-green-800', warning: 'bg-yellow-100 text-yellow-900', error: 'bg-red-100 text-red-800', outline: 'border border-gray-300 text-gray-800' };
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ variant = 'default', className, ...props }, ref) => <span ref={ref} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)} {...props} />);
Badge.displayName = 'Badge';
