import React from 'react';
import { cn } from '../../utils/cn';
import type { SkeletonProps } from './propTypes.skeleton';
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ circle, className, ...props }, ref) => <div ref={ref} aria-hidden="true" className={cn('animate-pulse bg-gray-200', circle ? 'rounded-full' : 'rounded-md', className)} {...props} />);
Skeleton.displayName = 'Skeleton';
