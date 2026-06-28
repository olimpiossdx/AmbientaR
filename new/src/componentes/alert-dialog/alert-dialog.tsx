import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../dialog';
import { cn } from '../../utils/cn';
import type { AlertDialogActionProps, AlertDialogProps } from './alert-dialog.types';
export function AlertDialog(props: AlertDialogProps) { return <Dialog modal {...props} />; }
export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogContent = DialogContent;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(({ variant = 'default', className, ...props }, ref) => <button ref={ref} className={cn('rounded-md px-4 py-2 text-sm font-medium transition', variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' : variant === 'secondary' ? 'border border-gray-300 bg-white hover:bg-gray-50' : 'bg-blue-600 text-white hover:bg-blue-700', className)} {...props} />);
AlertDialogAction.displayName = 'AlertDialogAction';
