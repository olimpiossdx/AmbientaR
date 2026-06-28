import type React from 'react';
export interface SheetProps extends React.HTMLAttributes<HTMLDivElement> { open: boolean; onOpenChange?: (open: boolean) => void; side?: 'left' | 'right' | 'top' | 'bottom'; }
