import type React from 'react';
export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; trigger?: React.ReactNode; }
