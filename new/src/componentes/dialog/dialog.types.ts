import type React from 'react';
export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; modal?: boolean; }
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> { onClose?: () => void; closeLabel?: string; }
