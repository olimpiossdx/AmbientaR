import React from 'react';
import { cn } from '../../utils/cn';
import type { ProgressProps } from './propTypes.progress';
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ value = 0, max = 100, showValue, className, ...props }, ref) => {
 const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
 return <div className="flex items-center gap-2"><div ref={ref} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)} {...props}><div className="h-full rounded-full bg-primary transition-all duration-300 ease-out" style={{ width: `${percent}%` }} /></div>{showValue && <span className="text-xs text-muted-foreground">{Math.round(percent)}%</span>}</div>;
});
Progress.displayName = 'Progress';
