import React from 'react';
import { cn } from '../../utils/cn';
import type { BadgeProps, BadgeVariant } from './propTypes.badge';
const variants: Record<BadgeVariant, string> = { default: 'bg-primary text-primary-foreground', secondary: 'bg-secondary text-secondary-foreground', success: 'bg-emerald-100 text-emerald-800', warning: 'bg-amber-100 text-amber-900', error: 'bg-destructive/10 text-destructive', outline: 'border border-border text-foreground' };
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ variant = 'default', className, ...props }, ref) => <span ref={ref} className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)} {...props} />);
Badge.displayName = 'Badge';
