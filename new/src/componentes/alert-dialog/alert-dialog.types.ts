import type React from 'react';
export interface AlertDialogProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode; }
export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'default' | 'destructive' | 'secondary'; }
