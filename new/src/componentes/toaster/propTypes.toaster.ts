import type React from 'react';
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default';
export interface ToastOptions { id?: string; title?: React.ReactNode; duration?: number; type?: ToastType; }
export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> { containerId?: string; position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'; }
