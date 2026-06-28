import type React from 'react';
export interface TabItem { value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean; }
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> { items?: TabItem[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; }
