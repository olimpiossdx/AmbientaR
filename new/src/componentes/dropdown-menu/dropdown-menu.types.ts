import type React from 'react';
export interface DropdownMenuItem { label: React.ReactNode; onSelect?: () => void; disabled?: boolean; destructive?: boolean; }
export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> { trigger: React.ReactNode; items?: DropdownMenuItem[]; }
