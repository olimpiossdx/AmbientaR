import React from 'react';
import { cn } from '../../utils/cn';
import type { CardProps } from './card.types';

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => <div ref={ref} className={cn('min-w-0 max-w-full break-words rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />);
export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex min-w-0 flex-col gap-1.5 p-4 sm:p-6', className)} {...props} />);
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h3 ref={ref} className={cn('min-w-0 break-words text-lg font-semibold leading-tight tracking-tight', className)} {...props} />);
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn('min-w-0 break-words text-sm text-muted-foreground', className)} {...props} />);
export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => <div ref={ref} className={cn('min-w-0 p-4 pt-0 sm:p-6 sm:pt-0', className)} {...props} />);
export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => <div ref={ref} className={cn('flex min-w-0 flex-wrap items-center gap-2 p-4 pt-0 sm:p-6 sm:pt-0', className)} {...props} />);
Card.displayName = 'Card'; CardHeader.displayName = 'CardHeader'; CardTitle.displayName = 'CardTitle'; CardDescription.displayName = 'CardDescription'; CardContent.displayName = 'CardContent'; CardFooter.displayName = 'CardFooter';
