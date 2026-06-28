import type React from 'react';
export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { variant?: BadgeVariant; }
