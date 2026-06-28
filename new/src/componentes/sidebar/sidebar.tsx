import React from 'react';
import { cn } from '../../utils/cn';
import type { SidebarProps } from './sidebar.types';
export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(({ collapsed, widthClassName, className, ...props }, ref) => <aside ref={ref} className={cn('flex h-full flex-col border-r border-gray-200 bg-white', collapsed ? 'w-16' : widthClassName ?? 'w-64', className)} {...props} />);
Sidebar.displayName = 'Sidebar';
