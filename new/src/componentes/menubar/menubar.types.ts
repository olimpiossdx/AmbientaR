import type React from 'react';
export interface MenubarItem { label: React.ReactNode; children?: MenubarItem[]; onSelect?: () => void; disabled?: boolean; }
export interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> { items?: MenubarItem[]; }
