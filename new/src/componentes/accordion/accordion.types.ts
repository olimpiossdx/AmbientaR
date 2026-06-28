import type React from 'react';
export interface AccordionItem { value: string; title: React.ReactNode; content: React.ReactNode; disabled?: boolean; }
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> { items?: AccordionItem[]; type?: 'single' | 'multiple'; defaultValue?: string | string[]; value?: string | string[]; onValueChange?: (value: string | string[]) => void; }
