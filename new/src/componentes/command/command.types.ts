import type React from 'react';
export interface CommandItem { value: string; label: React.ReactNode; keywords?: string[]; disabled?: boolean; onSelect?: (value: string) => void; }
export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> { items?: CommandItem[]; placeholder?: string; emptyMessage?: React.ReactNode; onValueChange?: (value: string) => void; }
